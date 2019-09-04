package org.andresoviedo.app.model3D.services.collada.loader;


import android.app.Activity;
import android.opengl.GLES20;
import android.util.Log;
import android.content.Context;

import org.andresoviedo.app.model3D.animation.Animation;
import org.andresoviedo.app.model3D.animation.JointTransform;
import org.andresoviedo.app.model3D.animation.KeyFrame;
import org.andresoviedo.app.model3D.controller.LoaderTask;
import org.andresoviedo.app.model3D.model.AnimatedModel;
import org.andresoviedo.app.model3D.model.Object3DBuilder;
import org.andresoviedo.app.model3D.model.Object3DData;
import org.andresoviedo.app.model3D.services.WavefrontLoader;
import org.andresoviedo.app.model3D.services.collada.entities.AnimatedModelData;
import org.andresoviedo.app.model3D.services.collada.entities.AnimationData;
import org.andresoviedo.app.model3D.services.collada.entities.Joint;
import org.andresoviedo.app.model3D.services.collada.entities.JointData;
import org.andresoviedo.app.model3D.services.collada.entities.JointTransformData;
import org.andresoviedo.app.model3D.services.collada.entities.KeyFrameData;
import org.andresoviedo.app.model3D.services.collada.entities.MeshData;
import org.andresoviedo.app.model3D.services.collada.entities.SkeletonData;
import org.andresoviedo.app.model3D.services.collada.entities.SkinningData;
import org.andresoviedo.app.model3D.services.collada.entities.Vector3f;
import org.andresoviedo.app.util.math.Quaternion;
import org.andresoviedo.app.util.xml.XmlNode;
import org.andresoviedo.app.util.xml.XmlParser;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.nio.IntBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ColladaLoader {

	private static ByteBuffer createNativeByteBuffer(int length) {
		// initialize vertex byte buffer for shape coordinates
		ByteBuffer bb = ByteBuffer.allocateDirect(length);
		// use the device hardware's native byte order
		bb.order(ByteOrder.nativeOrder());
		return bb;
	}

	private static Object[] buildAnimatedModel(URL url) throws IOException {
		List<AnimatedModel> ret = new ArrayList<AnimatedModel>();
		AnimatedModelData modelData = loadColladaModel(url.openStream(),3);
		List<MeshData> meshDataList = modelData.getMeshData();
		for (MeshData meshData : meshDataList) {
			int totalVertex = meshData.getVertexCount();

			// Allocate data
			FloatBuffer normalsBuffer = createNativeByteBuffer(totalVertex * 3 * 4).asFloatBuffer();
			FloatBuffer vertexBuffer = createNativeByteBuffer(totalVertex * 3 * 4).asFloatBuffer();
			IntBuffer indexBuffer = createNativeByteBuffer(meshData.getIndices().length * 4).asIntBuffer();


			// Initialize model dimensions (needed by the Object3DData#scaleCenter()
			WavefrontLoader.ModelDimensions modelDimensions = new WavefrontLoader.ModelDimensions();

			// notify succeded!
			AnimatedModel data3D = new AnimatedModel(vertexBuffer);
			data3D.setVertexBuffer(vertexBuffer);
			data3D.setVertexNormalsArrayBuffer(normalsBuffer);
			data3D.setTextureFile(meshData.getTexture());
			if (meshData.getTextureCoords() != null) {
				int totalTextures = meshData.getTextureCoords().length;
				FloatBuffer textureBuffer = createNativeByteBuffer(totalTextures * 4).asFloatBuffer();
				textureBuffer.put(meshData.getTextureCoords());
				data3D.setTextureCoordsArrayBuffer(textureBuffer);
			}
			data3D.setDimensions(modelDimensions);
			data3D.setDrawOrder(indexBuffer);
			data3D.setDrawUsingArrays(false);
			data3D.setDrawMode(GLES20.GL_TRIANGLES);

			if (meshData.getJointIds() != null) {
				FloatBuffer intBuffer = createNativeByteBuffer(meshData.getJointIds().length * 4).asFloatBuffer();
				for (int i : meshData.getJointIds()) {
					intBuffer.put(i);
				}
				data3D.setJointIds(intBuffer);
			}
			if (meshData.getVertexWeights() != null) {
				FloatBuffer floatBuffer = createNativeByteBuffer(meshData.getVertexWeights().length * 4).asFloatBuffer();
				floatBuffer.put(meshData.getVertexWeights());
				data3D.setVertexWeights(floatBuffer);
			}
			ret.add(data3D);
		}

		return new Object[]{modelData,ret};
	}

	private static void populateAnimatedModel(URL url, List<Object3DData> datas, AnimatedModelData modelData) throws IOException {
		int counter = 0;

		for (int i=0; i<datas.size(); i++) {
			Object3DData data = datas.get(i);

			// Parse all facets...
			double[] normal = new double[3];
			double[][] vertices = new double[3][3];
			int normalCounter = 0, vertexCounter = 0;

			FloatBuffer normalsBuffer = data.getVertexNormalsArrayBuffer();
			FloatBuffer vertexBuffer = data.getVertexArrayBuffer();
			IntBuffer indexBuffer = data.getDrawOrder();

			WavefrontLoader.ModelDimensions modelDimensions = data.getDimensions();

			MeshData meshData = modelData.getMeshData().get(i);

			boolean first = true;
			for (counter = 0; counter < meshData.getVertices().length - 3; counter += 3) {

				// update model dimensions
				if (first) {
					modelDimensions.set(meshData.getVertices()[counter], meshData.getVertices()[counter + 1], meshData.getVertices()[counter + 2]);
					first = false;
				}
				modelDimensions.update(meshData.getVertices()[counter], meshData.getVertices()[counter + 1], meshData.getVertices()[counter + 2]);

			}

			Log.i("ColladaLoaderTask", "Building 3D object '"+meshData.getId()+"'...");
			data.setId(meshData.getId());
			vertexBuffer.put(meshData.getVertices());
			normalsBuffer.put(meshData.getNormals());
			data.setVertexColorsArrayBuffer(meshData.getColorsBuffer());
			indexBuffer.put(meshData.getIndices());
			data.setFaces(new WavefrontLoader.Faces(vertexBuffer.capacity() / 3));
			data.setDrawOrder(indexBuffer);

			// Load skeleton and animation
			AnimatedModel data3D = (AnimatedModel) data;
			try {

				// load skeleton
				SkeletonData skeletonData = modelData.getJointsData();
				Joint headJoint = createJoints(skeletonData.headJoint);
				data3D.setRootJoint(headJoint, skeletonData.jointCount);

				// load animation
				Animation animation = loadAnimation(url.openStream());
				data3D.doAnimation(animation);
				Log.i("ColladaLoader", "Doing animation for mesh '"+meshData.getId()+"'");

				data3D.getJointTransforms();
			} catch (Exception e) {
				Log.e("ColladaLoader", "Problem loading model animation' " + e.getMessage(), e);
				data3D.doAnimation(null);
			}
		}
	}

	public static Object3DData load(URL url) throws IOException {
		Object[] ret = buildAnimatedModel(url);
		populateAnimatedModel(url,(List<Object3DData>)ret[1],(AnimatedModelData) ret[0]);
		return (Object3DData)ret[1];
	}

	public static void loadAsync(URL url, final Object3DBuilder.Callback callback) {
		new ColladaLoader.ColladaLoaderTask(url,callback).execute();
	}

	private static class ColladaLoaderTask extends LoaderTask {

		AnimatedModelData modelData;

		ColladaLoaderTask(URL url, Object3DBuilder.Callback callback) {
			super(null, url, callback);
		}

		@Override
		protected List<Object3DData> build() throws IOException {
			// Parse STL
			Object[] ret = buildAnimatedModel(url);
			List<Object3DData> datas = (List<Object3DData>)ret[1];
			modelData = (AnimatedModelData) ret[0];
			return datas;
		}

		@Override
		protected void build(List<Object3DData> datas) throws Exception
		{
			populateAnimatedModel(url, datas, modelData);
			if (datas.size() == 1){
				datas.get(0).centerAndScale(5, new float[]{0, 0, 0});
			}else{
				Object3DData.centerAndScale(datas,5, new float[]{0, 0, 0});
			}
		}
	}

	public static AnimatedModelData loadColladaModel(InputStream colladaFile, int maxWeights) {
		//XmlNode node = XmlParser.loadXmlFile(colladaFile);
		XmlNode node = null;
		Map<String,SkinningData> skinningData = null;
		SkeletonData jointsData = null;
		try {
			node = XmlParser.parse(colladaFile);

			SkinLoader skinLoader = new SkinLoader(node.getChild("library_controllers"), maxWeights);
			skinningData = skinLoader.extractSkinData();

			if (!skinningData.isEmpty()) {
				SkeletonLoader jointsLoader = new SkeletonLoader(node.getChild("library_visual_scenes"), skinningData.values().iterator().next().jointOrder);
				jointsData = jointsLoader.extractBoneData();
			}

			// TODO: test this
			if (jointsData == null){
				SkeletonLoader2 jointsLoader2 = new SkeletonLoader2(node.getChild("library_visual_scenes"));
				jointsData = jointsLoader2.extractBoneData();
			}
		}catch(Exception ex){
			Log.e("ColladaLoader","Problem loading skinning/skeleton data",ex);
		}

		GeometryLoader g = new GeometryLoader(node.getChild("library_geometries"), node.getChild("library_materials"),
				node.getChild("library_effects"), node.getChild("library_images"), skinningData, jointsData);
		List<MeshData> meshData = g.extractModelData();

		return new AnimatedModelData(meshData, jointsData);
	}

	/**
	 * Constructs the joint-hierarchy skeleton from the data extracted from the
	 * collada file.
	 *
	 * @param data
	 *            - the joints data from the collada file for the head joint.
	 * @return The created joint, with all its descendants added.
	 */
	private static Joint createJoints(JointData data) {
		Joint joint = new Joint(data.index, data.nameId, data.bindLocalTransform);
		for (JointData child : data.children) {
			joint.addChild(createJoints(child));
		}
		return joint;
	}

	static AnimationData loadColladaAnimation(InputStream colladaFile) {
		XmlNode node = XmlParser.parse(colladaFile);
		XmlNode animNode = node.getChild("library_animations");
		XmlNode jointsNode = node.getChild("library_visual_scenes");
		AnimationLoader loader = new AnimationLoader(animNode, jointsNode);
		AnimationData animData = loader.extractAnimation();
		return animData;
	}

	/**
	 * Loads up a collada animation file, and returns and animation created from
	 * the extracted animation data from the file.
	 *
	 * @param colladaFile
	 *            - the collada file containing data about the desired
	 *            animation.
	 * @return The animation made from the data in the file.
	 */
	public static Animation loadAnimation(InputStream colladaFile) {
		AnimationData animationData = loadColladaAnimation(colladaFile);
		KeyFrame[] frames = new KeyFrame[animationData.keyFrames.length];
		for (int i = 0; i < frames.length; i++) {
			frames[i] = createKeyFrame(animationData.keyFrames[i]);
		}
		return new Animation(animationData.lengthSeconds, frames);
	}

	/**
	 * Creates a keyframe from the data extracted from the collada file.
	 *
	 * @param data
	 *            - the data about the keyframe that was extracted from the
	 *            collada file.
	 * @return The keyframe.
	 */
	private static KeyFrame createKeyFrame(KeyFrameData data) {
		Map<String, JointTransform> map = new HashMap<String, JointTransform>();
		for (JointTransformData jointData : data.jointTransforms) {
			JointTransform jointTransform = createTransform(jointData);
			map.put(jointData.jointNameId, jointTransform);
		}
		return new KeyFrame(data.time, map);
	}

	/**
	 * Creates a joint transform from the data extracted from the collada file.
	 *
	 * @param data
	 *            - the data from the collada file.
	 * @return The joint transform.
	 */
	private static JointTransform createTransform(JointTransformData data) {
		float[] mat = data.jointLocalTransform;
		Vector3f translation = new Vector3f(mat[12], mat[13], mat[14]);
		Quaternion rotation = Quaternion.fromMatrix(mat);
		return new JointTransform(translation, rotation);
	}

}
