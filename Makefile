.PHONY: default deploy-beta run-android

default:
	rm -f src-*/*
	yarn
	gulp

deploy-beta:
	rsync -vrc web/* mli-sft@mli.doit.wisc.edu:/httpdocs/beta --exclude-from rsync-exclude

run-android:
	# https://github.com/marcshilling/react-native-image-picker/issues/241
	cd android && ./gradlew clean
	react-native run-android
