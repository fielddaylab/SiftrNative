.PHONY: default deploy-beta run-android

update:
	ruby preprocess.rb
	sass scss/styles.scss > web/styles.css
	yarn run build

install:
	rm -f src-*/*
	yarn
	cd ios && pod install && cd ..
	make update

deploy-beta:
	rsync -vrc web/* mli-sft@mli.doit.wisc.edu:/httpdocs/beta --exclude-from rsync-exclude

run-android:
	# https://github.com/marcshilling/react-native-image-picker/issues/241
	cd android && ./gradlew clean
	react-native run-android
