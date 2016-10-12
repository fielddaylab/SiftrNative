# Siftr web/native app

Instructions on Mac:

1. If you don't have Homebrew, [http://brew.sh/](http://brew.sh/)
2. `brew install node`
3. `sudo npm install -g gulp react-native-cli`
4. In this repo, `make first-time`
5. After you make any changes, `make`

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
