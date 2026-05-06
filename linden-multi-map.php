<?php
/**
 * Plugin Name: Linden Multi Map
 * Description: Shortcode: [linden_multi_map]. Shows ACF option page Google Map repeater locations on one styled map.
 * Version: 1.1.0
 * Author: Linden Events
 * Text Domain: linden-multi-map
 */

if (!defined('ABSPATH')) {
	exit;
}

define('LINDEN_MULTI_MAP_VERSION', '1.1.0');
define('LINDEN_MULTI_MAP_FILE', __FILE__);
define('LINDEN_MULTI_MAP_URL', plugin_dir_url(__FILE__));

final class Linden_Multi_Map {
	private static $map_index = 0;

	public static function init(): void {
		add_shortcode('linden_multi_map', [__CLASS__, 'render_shortcode']);
		add_action('wp_enqueue_scripts', [__CLASS__, 'register_assets']);
		add_action('admin_menu', [__CLASS__, 'add_settings_page']);
		add_action('admin_init', [__CLASS__, 'register_settings']);
		add_filter('acf/fields/google_map/api', [__CLASS__, 'set_acf_google_map_api_key']);
	}

	public static function register_assets(): void {
		wp_register_style(
			'linden-multi-map',
			LINDEN_MULTI_MAP_URL . 'assets/css/linden-multi-map.css',
			[],
			LINDEN_MULTI_MAP_VERSION
		);

		wp_register_script(
			'linden-multi-map',
			LINDEN_MULTI_MAP_URL . 'assets/js/linden-multi-map.js',
			[],
			LINDEN_MULTI_MAP_VERSION,
			true
		);
	}

	public static function render_shortcode($atts): string {
		$atts = shortcode_atts(
			[
				'api_key' => '',
				'option_name' => 'maps',
				'field_name' => 'map',
				'cluster' => 'true',
				'cluster_radius' => '72',
				'cluster_max_zoom' => '15',
				'class' => '',
			],
			$atts,
			'linden_multi_map'
		);

		$locations = self::get_locations($atts['option_name'], $atts['field_name']);

		if (empty($locations)) {
			return '';
		}

		self::$map_index++;

		$map_id = 'linden-multi-map-' . self::$map_index;
		$settings = self::get_map_settings();
		$height = $settings['height'];
		$zoom = $settings['zoom'];
		$api_key = self::get_api_key((string) $atts['api_key']);
		$pin_color = $settings['pin_color'];
		$pin_size = $settings['pin_size'];
		$cluster_enabled = filter_var($atts['cluster'], FILTER_VALIDATE_BOOLEAN);
		$cluster_radius = max(32, min(140, absint($atts['cluster_radius'])));
		$cluster_max_zoom = max(1, min(21, absint($atts['cluster_max_zoom'])));
		$fit_bounds = $settings['fit_bounds'];
		$classes = trim('linden-multi-map ' . sanitize_html_class((string) $atts['class']));

		wp_enqueue_style('linden-multi-map');
		wp_enqueue_script('linden-multi-map');

		wp_add_inline_script(
			'linden-multi-map',
			'window.LindenMultiMapData = window.LindenMultiMapData || []; window.LindenMultiMapData.push(' . wp_json_encode(
				[
					'id' => $map_id,
					'locations' => $locations,
					'zoom' => $zoom,
					'pinColor' => $pin_color,
					'pinSize' => $pin_size,
					'pinIcon' => $settings['pin_icon'],
					'cluster' => $cluster_enabled,
					'clusterRadius' => $cluster_radius,
					'clusterMaxZoom' => $cluster_max_zoom,
					'fitBounds' => $fit_bounds,
				]
			) . ');',
			'before'
		);

		self::enqueue_google_maps($api_key);

		return sprintf(
			'<div id="%1$s" class="%2$s" style="--linden-map-height:%3$s" aria-label="%4$s"></div>',
			esc_attr($map_id),
			esc_attr($classes),
			esc_attr($height),
			esc_attr__('Locations map', 'linden-multi-map')
		);
	}

	private static function get_locations(string $option_name, string $field_name): array {
		if (!function_exists('have_rows')) {
			return [];
		}

		$locations = [];

		if (!have_rows($option_name, 'option')) {
			return [];
		}

		while (have_rows($option_name, 'option')) {
			the_row();

			$map = get_sub_field($field_name);

			if (!is_array($map) || empty($map['lat']) || empty($map['lng'])) {
				continue;
			}

			$locations[] = [
				'lat' => (float) $map['lat'],
				'lng' => (float) $map['lng'],
				'address' => isset($map['address']) ? sanitize_text_field($map['address']) : '',
				'image' => self::get_image_url(get_sub_field('pin_image')),
				'icon' => self::get_image_url(get_sub_field('pin_icon')),
				'title' => sanitize_text_field((string) get_sub_field('pin_title')),
				'description' => wp_kses_post((string) get_sub_field('pin_description')),
				'link' => esc_url_raw((string) get_sub_field('pin_link')),
			];
		}

		return $locations;
	}

	private static function get_map_settings(): array {
		$settings = [
			'height' => '87vh',
			'zoom' => 11,
			'fit_bounds' => true,
			'pin_color' => '#15421f',
			'pin_size' => 25,
			'pin_icon' => '',
		];

		if (!function_exists('get_field')) {
			return $settings;
		}

		$height = get_field('map_height', 'option');
		$zoom = get_field('map_zoom', 'option');
		$fit_bounds = get_field('fit_bounds', 'option');
		$pin_color = get_field('pin_color', 'option');
		$pin_size = get_field('pin_size', 'option');
		$pin_icon = get_field('pin_icon', 'option');

		if ($height !== null && $height !== '') {
			$settings['height'] = sanitize_text_field((string) $height);
		}

		if ($zoom !== null && $zoom !== '') {
			$settings['zoom'] = max(1, min(21, absint($zoom)));
		}

		if ($fit_bounds !== null && $fit_bounds !== '') {
			$settings['fit_bounds'] = (bool) $fit_bounds;
		}

		if ($pin_color !== null && $pin_color !== '') {
			$settings['pin_color'] = sanitize_hex_color((string) $pin_color) ?: '#15421f';
		}

		if ($pin_size !== null && $pin_size !== '') {
			$settings['pin_size'] = max(20, min(90, absint($pin_size)));
		}

		if ($pin_icon !== null && $pin_icon !== '') {
			$settings['pin_icon'] = self::get_image_url($pin_icon);
		}

		return $settings;
	}

	private static function get_image_url($image): string {
		if (empty($image)) {
			return '';
		}

		if (is_array($image) && !empty($image['url'])) {
			return esc_url_raw((string) $image['url']);
		}

		if (is_numeric($image)) {
			$url = wp_get_attachment_image_url((int) $image, 'large');
			return $url ? esc_url_raw($url) : '';
		}

		if (is_string($image)) {
			return esc_url_raw($image);
		}

		return '';
	}

	private static function get_api_key(string $shortcode_key): string {
		$api_key = $shortcode_key;

		if ($api_key === '') {
			$api_key = (string) get_option('linden_multi_map_api_key', '');
		}

		if ($api_key === '' && defined('LINDEN_GOOGLE_MAPS_API_KEY')) {
			$api_key = (string) LINDEN_GOOGLE_MAPS_API_KEY;
		}

		return (string) apply_filters('linden_multi_map_google_api_key', $api_key);
	}

	public static function set_acf_google_map_api_key(array $api): array {
		$api_key = self::get_api_key('');

		if ($api_key !== '') {
			$api['key'] = $api_key;
			$api['libraries'] = 'places';
		}

		return $api;
	}

	private static function enqueue_google_maps(string $api_key): void {
		if (wp_script_is('linden-google-maps', 'enqueued')) {
			return;
		}

		$url = add_query_arg(
			array_filter(
				[
					'key' => $api_key,
					'callback' => 'LindenMultiMapInit',
					'libraries' => 'places',
					'v' => 'weekly',
				]
			),
			'https://maps.googleapis.com/maps/api/js'
		);

		wp_enqueue_script('linden-google-maps', esc_url_raw($url), ['linden-multi-map'], null, true);
	}

	public static function add_settings_page(): void {
		add_options_page(
			__('Linden Multi Map', 'linden-multi-map'),
			__('Linden Multi Map', 'linden-multi-map'),
			'manage_options',
			'linden-multi-map',
			[__CLASS__, 'render_settings_page']
		);
	}

	public static function register_settings(): void {
		register_setting(
			'linden_multi_map_settings',
			'linden_multi_map_api_key',
			[
				'type' => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default' => '',
			]
		);
	}

	public static function render_settings_page(): void {
		if (!current_user_can('manage_options')) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php esc_html_e('Linden Multi Map', 'linden-multi-map'); ?></h1>
			<form method="post" action="options.php">
				<?php settings_fields('linden_multi_map_settings'); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row">
							<label for="linden_multi_map_api_key"><?php esc_html_e('Google Maps API Key', 'linden-multi-map'); ?></label>
						</th>
						<td>
							<input
								type="text"
								id="linden_multi_map_api_key"
								name="linden_multi_map_api_key"
								value="<?php echo esc_attr(get_option('linden_multi_map_api_key', '')); ?>"
								class="regular-text"
								autocomplete="off"
							/>
							<p class="description">
								<?php esc_html_e('Use the shortcode [linden_multi_map] after saving your API key.', 'linden-multi-map'); ?>
							</p>
						</td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}
}

Linden_Multi_Map::init();
