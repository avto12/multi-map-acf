# Linden Multi Map

WordPress plugin ACF Options Page-იდან location-ების წამოსაღებად და ერთ styled Google Map-ზე გამოსაჩენად.

გამოყენება:

```text
[linden_multi_map]
```

## რას აკეთებს

- კითხულობს ACF Options Page repeater-ს სახელით `maps`.
- თითოეულ row-ში იღებს Google Map field-ს სახელით `map`.
- ყველა location-ს აჩვენებს ერთ რუკაზე.
- ახლოს მყოფ pin-ებს შორ zoom-ზე ავტომატურად აჯგუფებს count bubble-ად.
- Cluster bubble-ზე დაჭერისას რუკა იმ ჯგუფზე zoom-in-ს აკეთებს.
- Pin-ზე დაჭერისას ხსნის popup card-ს.
- Popup-ში აჩვენებს image-ს, title-ს, description-ს და link-ს.

## ACF Location Fields

Options Page-ზე უნდა გქონდეს repeater:

```text
maps
```

Repeater-ის შიგნით:

```text
map              Google Map
pin_image        Image
pin_icon         Image URL, optional row-level override
pin_title        Text
pin_description  WYSIWYG Editor
pin_link         URL
```

აუცილებელი ველია `map`. დანარჩენი ველები popup-ისთვის გამოიყენება.

## ACF Map Setting Fields

Map-ის პარამეტრები მოდის ACF Options Page field-ებიდან:

```text
map_height   Text
map_zoom     Number
fit_bounds   True / False
pin_color    Color Picker
pin_size     Number
pin_icon     Image URL
```

შენი current default მნიშვნელობები:

```text
map_height  87vh
map_zoom    11
fit_bounds  Default Value
pin_color   #15421f
pin_size    25
pin_icon     empty
```

Shortcode-ში ამ პარამეტრების მიწერა აღარ არის საჭირო.

## Shortcode

ძირითადი shortcode:

```text
[linden_multi_map]
```

ეს shortcode ავტომატურად იყენებს ACF Options Page-ში შევსებულ settings-ს:

```text
map_height
map_zoom
fit_bounds
pin_color
pin_size
pin_icon
```

თუ ACF-ში რომელიმე setting ცარიელია, plugin fallback-ად გამოიყენებს:

```text
map_height  87vh
map_zoom    11
fit_bounds  true
pin_color   #15421f
pin_size    25
pin_icon     empty
```

## Optional Shortcode Parameters

ჩვეულებრივ არ გჭირდება. ესენი დატოვებულია compatibility-სთვის:

```text
[linden_multi_map option_name="maps" field_name="map"]
```

API key პირდაპირ shortcode-შიც შეიძლება, თუმცა ჯობს Settings გვერდზე იყოს შენახული:

```text
[linden_multi_map api_key="YOUR_GOOGLE_MAPS_API_KEY"]
```

Cluster-ის გამორთვა, თუ ოდესმე დაგჭირდა:

```text
[linden_multi_map cluster="false"]
```

## Google Maps API Key

WordPress admin-ში შედი:

```text
Settings -> Linden Multi Map
```

ჩასვი Google Maps API Key და შეინახე.

Google Cloud Console-ში ჩართული უნდა იყოს:

```text
Maps JavaScript API
Places API
Geocoding API
```

Website restrictions-ში სასურველია:

```text
http://lindenevents.local/*
https://lindenevents.local/*
http://*.local/*
https://*.local/*
https://lindenevents.com/*
https://www.lindenevents.com/*
```

Project-ზე Billing უნდა იყოს ჩართული.

## Popup

Pin-ზე დაჭერისას popup-ში გამოჩნდება:

- `pin_image` როგორც background image
- `pin_icon` როგორც custom marker icon
- `pin_title` როგორც სათაური
- `pin_description` როგორც აღწერა
- `pin_link` როგორც clickable popup link

თუ `pin_link` ცარიელია, popup უბრალოდ გაიხსნება და ლინკზე არ გადავა.

Popup-ის style წერია:

```text
assets/css/linden-multi-map.css
```

Popup HTML იქმნება:

```text
assets/js/linden-multi-map.js
```

ფუნქცია:

```text
popupContent(location)
```

## Pin Color

Pin ფერი მოდის ACF field-იდან:

```text
pin_color
```

მაგალითად:

```text
#15421f
```

თუ ACF Map Setting-ში `pin_icon` შევსებულია, ყველა pin-ზე იმ image URL-ს გამოიყენებს. თუ კონკრეტულ `maps` row-შიც გაქვს `pin_icon`, ის მხოლოდ იმ row-ის pin-ს გადაფარავს. თუ `pin_icon` ყველგან ცარიელია, default SVG pin გამოჩნდება.

## Pin Size

Pin ზომა მოდის ACF field-იდან:

```text
pin_size
```

მაგალითად:

```text
25
```

## Map Height

Map სიმაღლე მოდის ACF field-იდან:

```text
map_height
```

მაგალითად:

```text
87vh
650px
100vh
```

## Map Zoom

Zoom მოდის ACF field-იდან:

```text
map_zoom
```

მაგალითად:

```text
11
```

თუ `fit_bounds` ჩართულია და რამდენიმე pin გაქვს, Google Map ყველა pin-ის გამოსაჩენად zoom-ს თვითონ აირჩევს. თუ გინდა `map_zoom` ზუსტად გამოიყენოს, ACF-ში `fit_bounds` გამორთე.

## Fit Bounds

`fit_bounds` ნიშნავს, რომ რუკამ ავტომატურად დააყენოს view ისე, რომ ყველა pin გამოჩნდეს.

```text
true   ყველა pin გამოჩნდეს ავტომატურად
false  გამოიყენოს map_zoom
```

## Cluster

Cluster default-ად ჩართულია.

თუ pin-ები ერთმანეთთან ახლოსაა და map შორ zoom-ზეა, ისინი count bubble-ად გამოჩნდება.

Bubble-ზე დაჭერისას რუკა zoom-in-ს გააკეთებს, რომ pin-ები ცალ-ცალკე გამოჩნდეს.

## Troubleshooting

თუ ჩანს:

```text
This page can't load Google Maps correctly
```

შეამოწმე:

- API key სწორად არის ჩასმული Settings -> Linden Multi Map-ში.
- Google Cloud project-ზე Billing ჩართულია.
- ჩართულია Maps JavaScript API, Places API და Geocoding API.
- Website restrictions-ში domain სწორად წერია და ბოლოში აქვს `/*`.
- Local-ზე `http` და `https` ორივე დამატებულია.

თუ ცვლილებები არ გამოჩნდა:

```text
Ctrl + F5
```

ან გაწმინდე browser/cache plugin cache.

## Plugin Files

```text
linden-multi-map.php
assets/js/linden-multi-map.js
assets/css/linden-multi-map.css
README.md
```
