# Siftr web/native app

Instructions on Mac:

1. If you don't have Homebrew, [http://brew.sh/](http://brew.sh/)
2. `brew install yarn`
3. `brew install pkg-config`
4. `brew install --HEAD watchman`
5. `sudo npm install -g gulp react-native-cli`
6. Run `make`.
7. Run `make` again after you make any changes.

iOS: open `ios/SiftrNative.xcodeproj`

  * To run non-dev mode, build with Release scheme.

Android: run `react-native run-android` (needs Android dev kit installed)

  * To make release APK, `cd android/ && ./gradlew assembleRelease`

  * To directly run the release version, `react-native run-android --variant=release`

  * For both of the above, you need this in `~/.gradle/gradle.properties`,
    with the key password in place of `*****`:

        FDL_RELEASE_STORE_FILE=fdl-release-key.keystore
        FDL_RELEASE_KEY_ALIAS=FieldDayLab
        FDL_RELEASE_STORE_PASSWORD=*****
        FDL_RELEASE_KEY_PASSWORD=*****

    And then copy `fdl-release-key.keystore` to `android/app/fdl-release-key.keystore`

Web: run web server with document root in `web/`
