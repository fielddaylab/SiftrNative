# The Station

Clone [https://github.com/fielddaylab/SiftrNative](https://github.com/fielddaylab/SiftrNative) and switch to branch `mapbox`.

1. If you don't have Homebrew, [http://brew.sh/](http://brew.sh/)
2. If you don't have Cocoapods, [https://cocoapods.org/](https://cocoapods.org/)
3. `brew install yarn`
4. `brew install pkg-config`
5. `sudo npm install -g react-native-cli`
6. Run `make install`.
7. Run `make` after you make any changes.

Open `ios/Siftr.xcworkspace` to launch the Xcode project, run, and build.

## Dev tips

[Documentation for the version of React Native currently used in The Station](https://reactnative.dev/docs/0.60/getting-started)

  * In the simulator, Cmd+Ctrl+Z (the "shake device" shortcut) opens the dev menu (when in Debug mode). There are 3 options for reloading the app when you change .js files:

    * Reload just restarts the app
    * Live Reload will automatically restart the app when you save a .js file
    * Hot Reload will reload and rerender components in the app without clearing state, if possible

  * Most of the code is in the form of React components. There are three different formats you may see:

    * A function, which takes a `props` argument and returns a tree of nodes
    * A class, in the form of `class (...) extends React.Component`, with a `render()` method
    * A legacy class made with `createClass`, with a `render:` method

    The [React docs](https://reactjs.org/docs/state-and-lifecycle.html) have more detailed information but basically a component gets `props` from above, can have `state` that it maintains internally, and then calls the `render` method (or just the function if not a class) when either the `props` or `state` change to get a new tree of nodes.

  * Debug mode is used in the simulator by default; to run Release mode, edit the scheme in Xcode (Product > Scheme > Edit Scheme). Release mode does not have the dev menu, does not use the separate reload server (all .js is bundled in advance), and does not show warning notifications.

  * To upload a build: increment the build number, make sure the proper certificate is set up, switch the device/simulator to "Build > Any iOS Device", and select Product > Archive. The build should complete and be listed in the Organizer window, where you can go through the final steps to upload it.

  * When you upload a build, it will be available to internal testers after a short processing period. Then on App Store Connect you can add it as an available build for external testers, and add notes for what changed.

Locations of most of the screens in the app:

  * `app.js`: the top-level component; switches between login, quest picker, and gameplay

  * `stemports-player.js`: the player screen
  * `stemports-picker.js`: the quest selector (map or list), also contains the logic for downloading quests
  * `stemports-wizard.js`: the 3 intro screens for a quest

  * `siftr-view.js`: the in-quest view (map, then delegates to other views)

  * `items.js`: the contents of caches, and also the field guide
  * `plaques.js`: the contents of tour stops
  * `create-note-native.js`: the steps for making observations
  * `quests.js`: in-quest progress screen

  * `media.js`: components that download and cache media files
  * `styles.js`, `global-styles.js`: various shared component styles
  * `upload-queue.js`: keeps track of uploading saved observations

  * `native-settings.js`: user settings (profile, change password, etc.)
