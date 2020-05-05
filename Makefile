.PHONY: install run-android

install:
	rm -f src-*/*
	yarn
	cd ios && pod install && cd ..

run-android:
	# https://github.com/marcshilling/react-native-image-picker/issues/241
	cd android && ./gradlew clean
	react-native run-android
