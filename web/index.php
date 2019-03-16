<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Siftr</title>
  <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1" />
  <meta name="apple-itunes-app" content="app-id=1169649470, app-argument=<?=
    (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]"
  ?>">
  <meta name="google-play-app" content="app-id=org.siftr.client">
  <script type="text/javascript" src="dist.js?cb=20190314"></script>
  <link rel="stylesheet" type="text/css" href="styles.css">
  <link rel="stylesheet" href="smart-app-banner.css" type="text/css" media="screen">
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,700|Varela+Round" rel="stylesheet">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16x16.png">
  <link rel="manifest" href="/assets/favicon/manifest.json">
  <link rel="mask-icon" href="/assets/favicon/safari-pinned-tab.svg" color="#5bbad5">
  <meta name="theme-color" content="#ffffff">
  <meta name="msapplication-TileColor" content="#da532c">
  <meta name="msapplication-TileImage" content="/assets/favicon/mstile-150x150.png">
  <meta name="theme-color" content="#ffffff">
  <meta content="True" name="HandheldFriendly">
</head>
<body>

<div id="app-container"></div>

<script src="smart-app-banner.js"></script>
<script type="text/javascript">
  new SmartBanner({
      daysHidden: 15,   // days to hide banner after close button is clicked (defaults to 15)
      daysReminder: 90, // days to hide banner after "VIEW" button is clicked (defaults to 90)
      title: 'Siftr',
      author: 'Field Day Lab',
      button: 'VIEW',
      store: {
          ios: 'On the App Store',
          android: 'In Google Play',
      },
      price: {
          ios: 'FREE',
          android: 'FREE',
      },
      icon: 'assets/img/siftr-app-logo.png',
  });
</script>
</body>
</html>
