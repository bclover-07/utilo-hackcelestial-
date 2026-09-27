import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/api.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';

const severityColors = <String, Color>{
  'clear': Color(0xFF4CAF50),
  'mild': Color(0xFF8BC34A),
  'moderate': Color(0xFFFFC107),
  'high': Color(0xFFFF9800),
  'severe': Color(0xFFF44336),
  'extreme': Color(0xFF9C27B0),
};

const riskColors = <String, Color>{
  'normal': Color(0xFF4CAF50),
  'elevated': Color(0xFFFF9800),
  'critical': Color(0xFFF44336),
};

Widget _neoBadge(String text, {Color bg = lavender, Color fg = ink}) {
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: bg,
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: ink, width: 1.2),
      boxShadow: const [BoxShadow(color: ink, offset: Offset(1, 1))],
    ),
    child: Text(
      text,
      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: fg),
    ),
  );
}

class WeatherTwinScreen extends StatefulWidget {
  const WeatherTwinScreen({super.key, required this.session});
  final Session session;

  @override
  State<WeatherTwinScreen> createState() => _WeatherTwinScreenState();
}

class _WeatherTwinScreenState extends State<WeatherTwinScreen> {
  String _selectedCity = 'Mumbai';
  final TextEditingController _cityController = TextEditingController(text: 'Mumbai');
  Key _remoteKey = UniqueKey();

  final List<String> _quickCities = const [
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Chennai',
    'Kolkata',
    'Pune',
    'Goa',
    'Jaipur',
  ];

  void _applyCity(String city) {
    final trimmed = city.trim();
    if (trimmed.isEmpty || trimmed == _selectedCity) return;
    setState(() {
      _selectedCity = trimmed;
      _cityController.text = trimmed;
      _remoteKey = UniqueKey();
    });
  }

  @override
  void dispose() {
    _cityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final api = widget.session.api;
    final path = '/digital-twin/state?city=${Uri.encodeComponent(_selectedCity)}';

    return PageBody(
      title: 'Weather Digital Twin',
      subtitle: 'Real-time weather monitoring with cascading impact analysis, what-if simulations, and social signal intelligence across your hospitality ecosystem.',
      children: [
        // City selector
        Panel(
          color: paperCard,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(Icons.location_on_outlined, size: 20, color: ink),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _cityController,
                      decoration: const InputDecoration(
                        hintText: 'Enter city name (e.g. Mumbai, Delhi)...',
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                      onSubmitted: _applyCity,
                    ),
                  ),
                  const SizedBox(width: 8),
                  NeoButton(
                    text: 'Analyze ↗',
                    color: teal,
                    fontSize: 13,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    onPressed: () => _applyCity(_cityController.text),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: _quickCities.map((c) {
                  final isSelected = c.toLowerCase() == _selectedCity.toLowerCase();
                  return InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () => _applyCity(c),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: isSelected ? yellow : card,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: ink, width: 1.4),
                        boxShadow: isSelected
                            ? const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))]
                            : null,
                      ),
                      child: Text(
                        c,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                          color: ink,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),

        // Live Remote Data State
        Remote(
          key: _remoteKey,
          api: api,
          path: path,
          builder: (data, reload) {
            final summary = (data['summary'] as Map?)?.cast<String, dynamic>() ?? {};
            final ecoImpact = (data['ecosystemOperationalImpact'] as Map?)?.cast<String, dynamic>() ?? {};
            final currentWeather = (data['currentWeather'] as Map?)?.cast<String, dynamic>() ?? {};
            final locations = records(data['entityLocations']);
            final forecast = records(data['forecast']);
            final forecastImpacts = records(data['forecastImpacts']);
            final categoryImpacts = (data['categoryImpacts'] as Map?)?.cast<String, dynamic>() ?? {};
            final cascadingEffects = records(data['cascadingEffects']);
            final socialSignals = (data['socialSignals'] as Map?)?.cast<String, dynamic>() ?? {};

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Reload & Status bar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const LivePulseDot(size: 8),
                        const SizedBox(width: 6),
                        Text(
                          'Live Digital Twin for $_selectedCity',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: ink),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh, size: 20, color: ink),
                      tooltip: 'Refresh Twin Data',
                      onPressed: reload,
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // 1. Summary Banner
                _SummaryBannerWidget(summary: summary),
                const SizedBox(height: 14),

                // 2. Utlio Ecosystem Operational Impact & Recommendations
                _EcosystemImpactWidget(impact: ecoImpact, city: _selectedCity),
                const SizedBox(height: 14),

                // 3. Live Weather Card
                _LiveWeatherCardWidget(weather: currentWeather),
                const SizedBox(height: 14),

                // 4. Geospatial Real-Time Weather & Asset Impact Map Visualizer
                _GeospatialMapWidget(
                  locations: locations,
                  weather: currentWeather,
                  city: _selectedCity,
                ),
                const SizedBox(height: 14),

                // 5. 7-Day Environmental Forecast & Probabilistic Demand Trajectory
                _ForecastAndTrajectoryWidget(
                  forecast: forecast,
                  forecastImpacts: forecastImpacts,
                ),
                const SizedBox(height: 14),

                // 6. 9-Category Impact Analysis
                _CategoryImpactSectionWidget(categoryImpacts: categoryImpacts),
                const SizedBox(height: 14),

                // 7. Multi-Order Cascading Effects Timeline
                _CascadingEffectsWidget(effects: cascadingEffects),
                const SizedBox(height: 14),

                // 8. What-If Counterfactual Simulator
                _WhatIfSimulatorWidget(
                  api: api,
                  city: _selectedCity,
                  baseWeather: currentWeather,
                ),
                const SizedBox(height: 14),

                // 9. Real-World Social & Public Signal Pulse
                _SocialPulseWidget(social: socialSignals),
              ],
            );
          },
        ),
      ],
    );
  }
}

// ==========================================
// 1. SUMMARY BANNER WIDGET
// ==========================================
class _SummaryBannerWidget extends StatelessWidget {
  const _SummaryBannerWidget({required this.summary});
  final Json summary;

  @override
  Widget build(BuildContext context) {
    final overallRisk = (summary['overallRisk'] ?? 'normal').toString();
    Color bg1;
    Color bg2;
    if (overallRisk == 'critical') {
      bg1 = const Color(0xFFFFEBEE);
      bg2 = const Color(0xFFFFCDD2);
    } else if (overallRisk == 'elevated') {
      bg1 = const Color(0xFFFFF3E0);
      bg2 = const Color(0xFFFFE0B2);
    } else {
      bg1 = const Color(0xFFE8F5E9);
      bg2 = const Color(0xFFC8E6C9);
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [bg1, bg2],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ink, width: 1.6),
        boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2.5))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      summary['headline']?.toString() ?? 'Monitoring Real-World Atmospheric Conditions',
                      style: const TextStyle(
                        fontFamily: 'SpaceGrotesk',
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        color: ink,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      summary['temperature']?.toString() ?? '',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Colors.grey.shade800,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: riskColors[overallRisk] ?? const Color(0xFF4CAF50),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: ink, width: 1.2),
                ),
                child: Text(
                  '${overallRisk.toUpperCase()} RISK',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _statBox('Categories', summary['categoriesMonitored']?.toString() ?? '9', ink),
              _statBox(
                'Critical',
                summary['criticalCategories']?.toString() ?? '0',
                (summary['criticalCategories'] ?? 0) > 0 ? const Color(0xFFF44336) : const Color(0xFF4CAF50),
              ),
              _statBox(
                'Elevated',
                summary['elevatedCategories']?.toString() ?? '0',
                (summary['elevatedCategories'] ?? 0) > 0 ? const Color(0xFFFF9800) : const Color(0xFF4CAF50),
              ),
              _statBox('Cascades', summary['cascadingEffectsCount']?.toString() ?? '0', ink),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statBox(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: ink, width: 1.2),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color, height: 1.1),
          ),
          Text(
            label.toUpperCase(),
            style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.black54),
          ),
        ],
      ),
    );
  }
}

// ==========================================
// 2. ECOSYSTEM OPERATIONAL IMPACT BANNER
// ==========================================
class _EcosystemImpactWidget extends StatelessWidget {
  const _EcosystemImpactWidget({required this.impact, required this.city});
  final Json impact;
  final String city;

  @override
  Widget build(BuildContext context) {
    if (impact.isEmpty) return const SizedBox.shrink();

    final pricingMult = (impact['smartPricingMultiplier'] as num?)?.toDouble() ?? 1.0;
    final pricingLabel = pricingMult > 1.0
        ? '+${((pricingMult - 1.0) * 100).round()}% Surge'
        : pricingMult < 1.0
            ? '-${((1.0 - pricingMult) * 100).round()}% Discount'
            : 'Baseline Rate';
    final pricingColor = pricingMult > 1.0 ? const Color(0xFFE65100) : const Color(0xFF2E7D32);

    final delay = impact['logisticsDelayMinutes'] ?? 0;
    final delayLabel = (delay is num && delay > 0) ? '+$delay min delay' : 'On Schedule';
    final delayColor = (delay is num && delay > 20) ? const Color(0xFFD32F2F) : const Color(0xFF388E3C);

    final workforce = (impact['workforceAvailabilityIndex'] as num?)?.toInt() ?? 100;
    final workforceColor = workforce < 80 ? const Color(0xFFD32F2F) : const Color(0xFF1976D2);

    final migration = impact['outdoorToIndoorShiftSurge']?.toString() ?? 'Baseline';

    return Panel(
      color: card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_outlined, size: 20, color: ink),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Utlio Ecosystem Operational Impact',
                  style: TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w900, fontSize: 15),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: lavender,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: ink, width: 1.2),
                ),
                child: const Text(
                  'AI INTELLIGENCE',
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: ink),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          LayoutBuilder(
            builder: (context, constraints) {
              final isNarrow = constraints.maxWidth < 600;
              return Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _ecoCard(
                    width: isNarrow ? constraints.maxWidth : (constraints.maxWidth - 10) / 2,
                    icon: '💡',
                    title: 'Weather Smart Pricing',
                    value: pricingLabel,
                    valueColor: pricingColor,
                    subtitle: impact['pricingAdvice']?.toString() ?? 'Dynamic rate recommendation',
                  ),
                  _ecoCard(
                    width: isNarrow ? constraints.maxWidth : (constraints.maxWidth - 10) / 2,
                    icon: '🚚',
                    title: 'Fleet & Delivery Transit',
                    value: delayLabel,
                    valueColor: delayColor,
                    subtitle: 'Route transit latency based on road & wind conditions in $city.',
                  ),
                  _ecoCard(
                    width: isNarrow ? constraints.maxWidth : (constraints.maxWidth - 10) / 2,
                    icon: '👨‍🍳',
                    title: 'Kitchen & Crew Workforce',
                    value: '$workforce% Capacity',
                    valueColor: workforceColor,
                    subtitle: 'Estimated commissary & setup staff mobility index.',
                  ),
                  _ecoCard(
                    width: isNarrow ? constraints.maxWidth : (constraints.maxWidth - 10) / 2,
                    icon: '🏢',
                    title: 'Indoor Space Migration',
                    value: migration,
                    valueColor: const Color(0xFF7B1FA2),
                    subtitle: 'Banquet hall and marquee shelter demand reallocation.',
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _ecoCard({
    required double width,
    required String icon,
    required String title,
    required String value,
    required Color valueColor,
    required String subtitle,
  }) {
    return Container(
      width: width,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: paperCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ink.withValues(alpha: 0.15), width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(icon, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.black87),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: valueColor),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey.shade700),
          ),
        ],
      ),
    );
  }
}

// ==========================================
// 3. LIVE WEATHER CARD WIDGET
// ==========================================
class _LiveWeatherCardWidget extends StatelessWidget {
  const _LiveWeatherCardWidget({required this.weather});
  final Json weather;

  @override
  Widget build(BuildContext context) {
    if (weather.isEmpty || weather['error'] != null) return const SizedBox.shrink();

    final sev = (weather['severity'] as Map?)?.cast<String, dynamic>() ?? {};
    final sevKey = sev['key']?.toString() ?? 'clear';
    final sevColor = severityColors[sevKey] ?? const Color(0xFF4CAF50);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ink, width: 1.5),
        boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2.5))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(weather['icon']?.toString() ?? '🌤️', style: const TextStyle(fontSize: 32)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      weather['city']?.toString() ?? 'Selected City',
                      style: const TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w900, fontSize: 18),
                    ),
                    Text(
                      weather['desc']?.toString() ?? '',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.grey.shade700),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: sevColor,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: ink, width: 1.2),
                ),
                child: Text(
                  sev['label']?.toString().toUpperCase() ?? 'NORMAL',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Colors.white),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _metricTile(
                icon: Icons.thermostat,
                label: 'Feels ${weather['feelsLike']}°C',
                value: '${weather['temperature']}°C',
                color: Colors.red.shade400,
              ),
              _metricTile(
                icon: Icons.water_drop_outlined,
                label: 'Rainfall',
                value: '${weather['precipitation']}mm',
                color: Colors.blue.shade400,
              ),
              _metricTile(
                icon: Icons.air,
                label: 'Wind',
                value: '${weather['windSpeed']}km/h',
                color: Colors.teal.shade400,
              ),
              _metricTile(
                icon: Icons.opacity,
                label: 'Humidity',
                value: '${weather['humidity']}%',
                color: Colors.indigo.shade400,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _metricTile({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: BoxDecoration(
          color: paperCard,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: ink.withValues(alpha: 0.12), width: 1),
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: ink),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.black54),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

// ==========================================
// 4. GEOSPATIAL MAP WIDGET
// ==========================================
class _GeospatialMapWidget extends StatefulWidget {
  const _GeospatialMapWidget({
    required this.locations,
    required this.weather,
    required this.city,
  });
  final List<Json> locations;
  final Json weather;
  final String city;

  @override
  State<_GeospatialMapWidget> createState() => _GeospatialMapWidgetState();
}

class _GeospatialMapWidgetState extends State<_GeospatialMapWidget> with SingleTickerProviderStateMixin {
  String _selectedCategory = 'all';
  Json? _inspectedLocation;
  late AnimationController _pulseController;

  final List<String> _categories = const [
    'all',
    'banquet_hall',
    'vehicles',
    'parking_capacity',
    'kitchen',
    'av_equipment',
    'furniture',
    'chairs',
  ];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filteredLocations = widget.locations.where((loc) {
      if (_selectedCategory == 'all') return true;
      return loc['category'] == _selectedCategory;
    }).toList();

    final coords = (widget.weather['coordinates'] as Map?)?.cast<String, dynamic>() ?? {};
    final centerLat = (coords['lat'] as num?)?.toDouble() ?? 19.0760;
    final centerLon = (coords['lon'] as num?)?.toDouble() ?? 72.8777;

    final sev = (widget.weather['severity'] as Map?)?.cast<String, dynamic>() ?? {};
    final sevKey = sev['key']?.toString() ?? 'clear';
    final sevColor = severityColors[sevKey] ?? const Color(0xFF4CAF50);

    return Panel(
      color: card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.public, size: 20, color: ink),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Geospatial Asset & Weather Footprint Map',
                  style: TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w900, fontSize: 15),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: mint,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: ink, width: 1.2),
                ),
                child: const Text(
                  'GEOSPATIAL TWIN',
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: ink),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Category filter bar
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _categories.map((cat) {
                final isSelected = _selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () => setState(() => _selectedCategory = cat),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isSelected ? yellow : paperCard,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: ink, width: 1.2),
                        boxShadow: isSelected
                            ? const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))]
                            : null,
                      ),
                      child: Text(
                        cat == 'all' ? 'All (${widget.locations.length})' : cat.replaceAll('_', ' '),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                          color: ink,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // Custom Geospatial Map View
          Container(
            height: 280,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFF1E2638),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: ink, width: 1.6),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Stack(
                children: [
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, _) {
                      return CustomPaint(
                        size: Size.infinite,
                        painter: _GeospatialMapPainter(
                          centerLat: centerLat,
                          centerLon: centerLon,
                          locations: filteredLocations,
                          sevColor: sevColor,
                          pulseValue: _pulseController.value,
                          cityName: widget.city,
                          weatherIcon: widget.weather['icon']?.toString() ?? '🌤️',
                          temperature: widget.weather['temperature']?.toString() ?? '28',
                          inspectedId: _inspectedLocation?['_id']?.toString(),
                        ),
                      );
                    },
                  ),

                  // Pin Tap Interactivity Layer
                  Positioned.fill(
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        return Stack(
                          children: [
                            // Center Weather Hub Clickable
                            Positioned(
                              left: constraints.maxWidth / 2 - 20,
                              top: constraints.maxHeight / 2 - 20,
                              child: GestureDetector(
                                onTap: () {
                                  setState(() => _inspectedLocation = {
                                    'title': '${widget.weather['icon']} ${widget.city} Weather Hub',
                                    'category': 'Environmental Center',
                                    'city': widget.city,
                                    'impact': {
                                      'cancellationRisk': sevKey == 'severe' ? 75 : sevKey == 'high' ? 50 : 20,
                                      'demandChange': sevKey == 'severe' ? -35 : -10,
                                      'supplyChange': sevKey == 'severe' ? -25 : -5,
                                    },
                                  });
                                },
                                child: Container(
                                  width: 40,
                                  height: 40,
                                  color: Colors.transparent,
                                ),
                              ),
                            ),

                            // Asset Pins Clickable
                            ...filteredLocations.map((loc) {
                              final lat = (loc['lat'] as num?)?.toDouble() ?? centerLat;
                              final lon = (loc['lon'] as num?)?.toDouble() ?? centerLon;
                              final dLat = (lat - centerLat);
                              final dLon = (lon - centerLon);

                              // Coordinate mapping to screen dimensions
                              final px = constraints.maxWidth / 2 + dLon * (constraints.maxWidth * 6.5);
                              final py = constraints.maxHeight / 2 - dLat * (constraints.maxHeight * 6.5);

                              if (px < 0 || px > constraints.maxWidth || py < 0 || py > constraints.maxHeight) {
                                return const SizedBox.shrink();
                              }

                              return Positioned(
                                left: px - 14,
                                top: py - 14,
                                child: GestureDetector(
                                  onTap: () => setState(() => _inspectedLocation = loc),
                                  child: Container(
                                    width: 28,
                                    height: 28,
                                    color: Colors.transparent,
                                  ),
                                ),
                              );
                            }),
                          ],
                        );
                      },
                    ),
                  ),

                  // Inspected Pin Overlay
                  if (_inspectedLocation != null)
                    Positioned(
                      bottom: 10,
                      left: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: card,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: ink, width: 1.5),
                          boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2))],
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    _inspectedLocation!['title']?.toString() ?? 'Hospitality Asset',
                                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: ink),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    '🏷️ ${(_inspectedLocation!['category']?.toString() ?? '').replaceAll('_', ' ')} · 📍 ${_inspectedLocation!['city'] ?? widget.city}',
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.black54),
                                  ),
                                  if (_inspectedLocation!['impact'] is Map) ...[
                                    const SizedBox(height: 3),
                                    Text(
                                      'Cancel Risk: ${(_inspectedLocation!['impact'] as Map)['cancellationRisk']}% | Demand Δ: ${(_inspectedLocation!['impact'] as Map)['demandChange']}%',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        color: ((_inspectedLocation!['impact'] as Map)['cancellationRisk'] ?? 0) > 50
                                            ? const Color(0xFFF44336)
                                            : const Color(0xFF4CAF50),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close, size: 16, color: ink),
                              onPressed: () => setState(() => _inspectedLocation = null),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Legend
          Wrap(
            spacing: 12,
            runSpacing: 6,
            children: [
              _legendItem(const Color(0xFF4CAF50), 'Normal Risk (<30%)'),
              _legendItem(const Color(0xFFFF9800), 'Elevated (30-60%)'),
              _legendItem(const Color(0xFFF44336), 'Critical (>60%)'),
              _legendItem(sevColor, 'Weather Footprint'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _legendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.black87),
        ),
      ],
    );
  }
}

// Geospatial Canvas Painter
class _GeospatialMapPainter extends CustomPainter {
  _GeospatialMapPainter({
    required this.centerLat,
    required this.centerLon,
    required this.locations,
    required this.sevColor,
    required this.pulseValue,
    required this.cityName,
    required this.weatherIcon,
    required this.temperature,
    this.inspectedId,
  });

  final double centerLat;
  final double centerLon;
  final List<Json> locations;
  final Color sevColor;
  final double pulseValue;
  final String cityName;
  final String weatherIcon;
  final String temperature;
  final String? inspectedId;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;

    // 1. Radar Grid & Coordinate Lines
    final gridPaint = Paint()
      ..color = const Color(0xFF2C394F)
      ..strokeWidth = 1.0;

    for (var i = 1; i <= 4; i++) {
      final r = (size.height / 2.2) * (i / 4);
      canvas.drawCircle(Offset(cx, cy), r, gridPaint..style = PaintingStyle.stroke);
    }

    canvas.drawLine(Offset(0, cy), Offset(size.width, cy), gridPaint);
    canvas.drawLine(Offset(cx, 0), Offset(cx, size.height), gridPaint);

    // 2. Pulsing Weather Footprint Ring
    final pulseRadius = (size.height * 0.42) + (pulseValue * 16);
    final footprintPaint = Paint()
      ..color = sevColor.withValues(alpha: (0.22 - pulseValue * 0.15).clamp(0.02, 0.3))
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(cx, cy), pulseRadius, footprintPaint);

    final footprintRingPaint = Paint()
      ..color = sevColor.withValues(alpha: 0.7)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8;
    canvas.drawCircle(Offset(cx, cy), size.height * 0.42, footprintRingPaint);

    // 3. Asset Locations Pins
    for (final loc in locations) {
      final lat = (loc['lat'] as num?)?.toDouble() ?? centerLat;
      final lon = (loc['lon'] as num?)?.toDouble() ?? centerLon;
      final dLat = lat - centerLat;
      final dLon = lon - centerLon;

      final px = cx + dLon * (size.width * 6.5);
      final py = cy - dLat * (size.height * 6.5);

      if (px < 10 || px > size.width - 10 || py < 10 || py > size.height - 10) continue;

      final imp = (loc['impact'] as Map?)?.cast<String, dynamic>();
      final cancelRisk = (imp?['cancellationRisk'] as num?)?.toDouble() ?? 10.0;
      final pinColor = cancelRisk > 60
          ? const Color(0xFFF44336)
          : cancelRisk > 30
              ? const Color(0xFFFF9800)
              : const Color(0xFF4CAF50);

      final isSelected = loc['_id']?.toString() == inspectedId;

      if (isSelected) {
        final selectGlow = Paint()
          ..color = Colors.white.withValues(alpha: 0.4)
          ..style = PaintingStyle.fill;
        canvas.drawCircle(Offset(px, py), 12, selectGlow);
      }

      // Pin circle
      final pinPaint = Paint()
        ..color = pinColor
        ..style = PaintingStyle.fill;
      canvas.drawCircle(Offset(px, py), isSelected ? 7 : 5, pinPaint);

      final borderPaint = Paint()
        ..color = ink
        ..strokeWidth = 1.2
        ..style = PaintingStyle.stroke;
      canvas.drawCircle(Offset(px, py), isSelected ? 7 : 5, borderPaint);
    }

    // 4. Center Weather Hub Station
    final centerHubPaint = Paint()
      ..color = sevColor
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(cx, cy), 12, centerHubPaint);

    final hubBorderPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;
    canvas.drawCircle(Offset(cx, cy), 12, hubBorderPaint);

    // Hub Text Label
    final tp = TextPainter(
      text: TextSpan(
        text: '$cityName\n$temperature°C',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w900,
          height: 1.1,
        ),
      ),
      textAlign: TextAlign.center,
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, Offset(cx - tp.width / 2, cy + 16));
  }

  @override
  bool shouldRepaint(covariant _GeospatialMapPainter oldDelegate) {
    return oldDelegate.pulseValue != pulseValue ||
        oldDelegate.locations != locations ||
        oldDelegate.inspectedId != inspectedId ||
        oldDelegate.sevColor != sevColor;
  }
}

// ==========================================
// 5. 7-DAY FORECAST & PROBABILISTIC DEMAND
// ==========================================
class _ForecastAndTrajectoryWidget extends StatefulWidget {
  const _ForecastAndTrajectoryWidget({
    required this.forecast,
    required this.forecastImpacts,
  });
  final List<Json> forecast;
  final List<Json> forecastImpacts;

  @override
  State<_ForecastAndTrajectoryWidget> createState() => _ForecastAndTrajectoryWidgetState();
}

class _ForecastAndTrajectoryWidgetState extends State<_ForecastAndTrajectoryWidget> {
  String _mode = 'weather'; // 'weather' or 'probabilistic'
  int? _hoveredIndex;

  @override
  Widget build(BuildContext context) {
    if (widget.forecast.isEmpty) return const SizedBox.shrink();

    return Panel(
      color: card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.show_chart, size: 20, color: ink),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  '7-Day Forecast & Probabilistic Twin',
                  style: TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w900, fontSize: 15),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: paperCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: ink, width: 1.2),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _toggleBtn('🌤️ Weather', _mode == 'weather', () => setState(() => _mode = 'weather')),
                    _toggleBtn('📈 Twin', _mode == 'probabilistic', () => setState(() => _mode = 'probabilistic')),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Horizontal 7-Day Day Strip
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: widget.forecast.map((d) {
                final dateStr = (d['date']?.toString() ?? '').length >= 10
                    ? (d['date']?.toString() ?? '').substring(5)
                    : (d['date']?.toString() ?? '');
                final sev = (d['severity'] as Map?)?.cast<String, dynamic>() ?? {};
                final sevKey = sev['key']?.toString() ?? 'clear';
                final sevColor = severityColors[sevKey] ?? const Color(0xFF4CAF50);

                return Container(
                  width: 72,
                  margin: const EdgeInsets.only(right: 6),
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                  decoration: BoxDecoration(
                    color: paperCard,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: ink.withValues(alpha: 0.15), width: 1.2),
                  ),
                  child: Column(
                    children: [
                      Text(dateStr, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.black54)),
                      const SizedBox(height: 2),
                      Text(d['icon']?.toString() ?? '🌤️', style: const TextStyle(fontSize: 18)),
                      const SizedBox(height: 2),
                      Text('${d['tempMax']}°/${d['tempMin']}°', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900)),
                      Text('🌧${d['precipitation']}mm', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.blue)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: sevColor,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          sev['label']?.toString().toUpperCase() ?? 'OK',
                          style: const TextStyle(fontSize: 7, fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),

          // Custom Chart Canvas
          Container(
            height: 210,
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(10, 14, 10, 8),
            decoration: BoxDecoration(
              color: paperCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ink.withValues(alpha: 0.2), width: 1.2),
            ),
            child: GestureDetector(
              onTapDown: (details) {
                final width = MediaQuery.sizeOf(context).width;
                final count = widget.forecast.length;
                if (count == 0) return;
                final idx = ((details.localPosition.dx / width) * count).floor().clamp(0, count - 1);
                setState(() => _hoveredIndex = idx);
              },
              child: CustomPaint(
                size: Size.infinite,
                painter: _AreaForecastChartPainter(
                  mode: _mode,
                  forecast: widget.forecast,
                  forecastImpacts: widget.forecastImpacts,
                  hoveredIndex: _hoveredIndex,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),

          // Chart Key indicators
          if (_mode == 'weather')
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _chartKeyDot(const Color(0xFFF44336), 'Max Temp °C'),
                const SizedBox(width: 14),
                _chartKeyDot(const Color(0xFF2196F3), 'Min Temp °C'),
                const SizedBox(width: 14),
                _chartKeyDot(const Color(0xFF4CAF50), 'Rain mm'),
              ],
            )
          else
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 12,
              children: [
                _chartKeyDot(const Color(0xFF1565C0), 'Expected Demand Index (100 Base)'),
                _chartKeyDot(const Color(0xFF90CAF9), '90% Confidence Band'),
                _chartKeyDot(const Color(0xFFF44336), 'Cancellation Risk %'),
              ],
            ),
        ],
      ),
    );
  }

  Widget _toggleBtn(String title, bool active, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: active ? yellow : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 11,
            fontWeight: active ? FontWeight.w900 : FontWeight.w700,
            color: ink,
          ),
        ),
      ),
    );
  }

  Widget _chartKeyDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 5),
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: ink)),
      ],
    );
  }
}

// Custom Area Chart Painter
class _AreaForecastChartPainter extends CustomPainter {
  _AreaForecastChartPainter({
    required this.mode,
    required this.forecast,
    required this.forecastImpacts,
    this.hoveredIndex,
  });

  final String mode;
  final List<Json> forecast;
  final List<Json> forecastImpacts;
  final int? hoveredIndex;

  @override
  void paint(Canvas canvas, Size size) {
    final count = forecast.length;
    if (count < 2) return;

    final gridPaint = Paint()
      ..color = const Color(0xFFE5E0CF)
      ..strokeWidth = 1.0;

    // Draw horizontal gridlines
    for (var i = 0; i <= 4; i++) {
      final y = size.height * (i / 4);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final stepX = size.width / (count - 1);

    if (mode == 'weather') {
      _drawWeatherMode(canvas, size, count, stepX);
    } else {
      _drawProbabilisticMode(canvas, size, count, stepX);
    }

    // Draw X-axis date labels
    for (var i = 0; i < count; i++) {
      final d = forecast[i];
      final dateStr = (d['date']?.toString() ?? '').length >= 10
          ? (d['date']?.toString() ?? '').substring(5)
          : (d['date']?.toString() ?? '');
      final x = i * stepX;
      final tp = TextPainter(
        text: TextSpan(
          text: dateStr,
          style: TextStyle(
            color: hoveredIndex == i ? ink : Colors.black54,
            fontSize: 9,
            fontWeight: hoveredIndex == i ? FontWeight.w900 : FontWeight.w700,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset((x - tp.width / 2).clamp(0.0, size.width - tp.width), size.height - 12));
    }
  }

  void _drawWeatherMode(Canvas canvas, Size size, int count, double stepX) {
    final maxTempPath = Path();
    final minTempPath = Path();
    final rainPath = Path();

    double mapTemp(num val) => (size.height - 24) - ((val.toDouble() / 50.0) * (size.height - 30));
    double mapRain(num val) => (size.height - 24) - ((val.toDouble() / 60.0) * (size.height - 30));

    for (var i = 0; i < count; i++) {
      final d = forecast[i];
      final x = i * stepX;
      final tMax = mapTemp(d['tempMax'] ?? 30);
      final tMin = mapTemp(d['tempMin'] ?? 20);
      final rain = mapRain(d['precipitation'] ?? 0);

      if (i == 0) {
        maxTempPath.moveTo(x, tMax);
        minTempPath.moveTo(x, tMin);
        rainPath.moveTo(x, rain);
      } else {
        maxTempPath.lineTo(x, tMax);
        minTempPath.lineTo(x, tMin);
        rainPath.lineTo(x, rain);
      }
    }

    // Shaded areas
    final maxFill = Path.from(maxTempPath)
      ..lineTo(size.width, size.height - 24)
      ..lineTo(0, size.height - 24)
      ..close();
    canvas.drawPath(maxFill, Paint()..color = const Color(0xFFFFCDD2).withValues(alpha: 0.35));

    final minFill = Path.from(minTempPath)
      ..lineTo(size.width, size.height - 24)
      ..lineTo(0, size.height - 24)
      ..close();
    canvas.drawPath(minFill, Paint()..color = const Color(0xFFBBDEFB).withValues(alpha: 0.3));

    // Lines
    canvas.drawPath(maxTempPath, Paint()..color = const Color(0xFFF44336)..strokeWidth = 2.4..style = PaintingStyle.stroke);
    canvas.drawPath(minTempPath, Paint()..color = const Color(0xFF2196F3)..strokeWidth = 2.0..style = PaintingStyle.stroke);
    canvas.drawPath(rainPath, Paint()..color = const Color(0xFF4CAF50)..strokeWidth = 1.8..style = PaintingStyle.stroke);
  }

  void _drawProbabilisticMode(Canvas canvas, Size size, int count, double stepX) {
    final upperPath = Path();
    final expectedPath = Path();
    final lowerPath = Path();
    final riskPath = Path();

    // Mapping 40 to 160 index to canvas height
    double mapIndex(num val) {
      final clamped = val.toDouble().clamp(40.0, 160.0);
      return (size.height - 24) - (((clamped - 40.0) / 120.0) * (size.height - 30));
    }

    final impacts = forecastImpacts.isNotEmpty ? forecastImpacts : forecast;

    for (var i = 0; i < count; i++) {
      final imp = i < impacts.length ? impacts[i] : forecast[i];
      final x = i * stepX;
      final up = mapIndex(imp['confidenceHigh'] ?? 115);
      final exp = mapIndex(imp['expectedDemandIndex'] ?? 100);
      final low = mapIndex(imp['confidenceLow'] ?? 85);
      final risk = mapIndex(imp['cancellationProbability'] ?? 20);

      if (i == 0) {
        upperPath.moveTo(x, up);
        expectedPath.moveTo(x, exp);
        lowerPath.moveTo(x, low);
        riskPath.moveTo(x, risk);
      } else {
        upperPath.lineTo(x, up);
        expectedPath.lineTo(x, exp);
        lowerPath.lineTo(x, low);
        riskPath.lineTo(x, risk);
      }
    }

    // Confidence envelope band fill
    final bandFill = Path.from(upperPath);
    for (var i = count - 1; i >= 0; i--) {
      final imp = i < impacts.length ? impacts[i] : forecast[i];
      final x = i * stepX;
      final low = mapIndex(imp['confidenceLow'] ?? 85);
      bandFill.lineTo(x, low);
    }
    bandFill.close();
    canvas.drawPath(bandFill, Paint()..color = const Color(0xFF1976D2).withValues(alpha: 0.18));

    // Lines
    canvas.drawPath(upperPath, Paint()..color = const Color(0xFF90CAF9)..strokeWidth = 1.5..style = PaintingStyle.stroke);
    canvas.drawPath(expectedPath, Paint()..color = const Color(0xFF1565C0)..strokeWidth = 2.8..style = PaintingStyle.stroke);
    canvas.drawPath(lowerPath, Paint()..color = const Color(0xFF90CAF9)..strokeWidth = 1.5..style = PaintingStyle.stroke);
    canvas.drawPath(riskPath, Paint()..color = const Color(0xFFF44336)..strokeWidth = 2.0..style = PaintingStyle.stroke);
  }

  @override
  bool shouldRepaint(covariant _AreaForecastChartPainter oldDelegate) {
    return oldDelegate.mode != mode ||
        oldDelegate.hoveredIndex != hoveredIndex ||
        oldDelegate.forecast != forecast ||
        oldDelegate.forecastImpacts != forecastImpacts;
  }
}

// ==========================================
// 6. 9-CATEGORY IMPACT SECTION WIDGET
// ==========================================
class _CategoryImpactSectionWidget extends StatelessWidget {
  const _CategoryImpactSectionWidget({required this.categoryImpacts});
  final Map<String, dynamic> categoryImpacts;

  @override
  Widget build(BuildContext context) {
    if (categoryImpacts.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.category_outlined, size: 20, color: ink),
            const SizedBox(width: 8),
            const Expanded(
              child: Text(
                'Category Impact Analysis',
                style: TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w900, fontSize: 16),
              ),
            ),
            _neoBadge('${categoryImpacts.length} categories'),
          ],
        ),
        const SizedBox(height: 12),
        ...categoryImpacts.entries.map((e) {
          final catData = (e.value as Map?)?.cast<String, dynamic>() ?? {};
          return _CategoryImpactCardWidget(
            categoryKey: e.key,
            data: catData,
          );
        }),
      ],
    );
  }
}

class _CategoryImpactCardWidget extends StatefulWidget {
  const _CategoryImpactCardWidget({
    required this.categoryKey,
    required this.data,
  });
  final String categoryKey;
  final Json data;

  @override
  State<_CategoryImpactCardWidget> createState() => _CategoryImpactCardWidgetState();
}

class _CategoryImpactCardWidgetState extends State<_CategoryImpactCardWidget> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final riskLevel = widget.data['riskLevel']?.toString() ?? 'normal';
    final riskColor = riskColors[riskLevel] ?? const Color(0xFF4CAF50);
    final supply = (widget.data['supply'] as Map?)?.cast<String, dynamic>() ?? {};
    final demand = (widget.data['demand'] as Map?)?.cast<String, dynamic>() ?? {};
    final imp = (widget.data['weatherImpact'] as Map?)?.cast<String, dynamic>() ?? {};
    final adjustedSupply = (widget.data['adjustedSupply'] as Map?)?.cast<String, dynamic>() ?? {};
    final factors = (imp['factors'] as Map?)?.cast<String, dynamic>() ?? {};

    final demandChange = (imp['demandChange'] as num?)?.toDouble() ?? 0.0;
    final supplyChange = (imp['supplyChange'] as num?)?.toDouble() ?? 0.0;
    final cancelRisk = (imp['cancellationRisk'] as num?)?.toDouble() ?? 0.0;
    final priceAdj = (imp['priceAdjustment'] as num?)?.toDouble() ?? 0.0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ink, width: 1.5),
        boxShadow: const [BoxShadow(color: ink, offset: Offset(2, 2.5))],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Column(
          children: [
            // Top Accent Risk Line
            Container(height: 4, width: double.infinity, color: riskColor),

            // Header Clickable
            InkWell(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.categoryKey.replaceAll('_', ' ').toUpperCase(),
                            style: const TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w900, fontSize: 14),
                          ),
                          Text(
                            '${riskLevel.toUpperCase()} RISK',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: riskColor),
                          ),
                        ],
                      ),
                    ),
                    Icon(_expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: ink),
                  ],
                ),
              ),
            ),

            // KPI Counts
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              child: Row(
                children: [
                  _kpiCol('Listings', '${supply['activeListings'] ?? 0}'),
                  _kpiCol('Units', '${supply['totalUnits'] ?? 0}'),
                  _kpiCol('Bookings', '${demand['activeBookings'] ?? 0}'),
                  _kpiCol('Open RFQs', '${demand['openRequests'] ?? 0}'),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Impact Progress Gauges
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              child: Column(
                children: [
                  _gaugeRow('Demand Δ', demandChange, demandChange < -10 ? const Color(0xFFF44336) : demandChange < 0 ? const Color(0xFFFF9800) : const Color(0xFF4CAF50)),
                  const SizedBox(height: 6),
                  _gaugeRow('Supply Δ', supplyChange, supplyChange < -10 ? const Color(0xFFF44336) : supplyChange < 0 ? const Color(0xFFFF9800) : const Color(0xFF4CAF50)),
                  const SizedBox(height: 6),
                  _gaugeRow('Cancel Risk', cancelRisk, cancelRisk > 60 ? const Color(0xFFF44336) : cancelRisk > 30 ? const Color(0xFFFF9800) : const Color(0xFF4CAF50)),
                ],
              ),
            ),

            // Accordion Details
            if (_expanded)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: paperCard,
                  border: Border(top: BorderSide(color: ink.withValues(alpha: 0.15), width: 1.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _detailRow('Confidence', '${imp['confidence'] ?? 85}%'),
                    _detailRow(
                      'Price Adjustment',
                      '${priceAdj > 0 ? '+' : ''}$priceAdj%',
                      valColor: priceAdj < 0 ? const Color(0xFFF44336) : const Color(0xFF4CAF50),
                    ),
                    _detailRow('Average Base Price', money(supply['avgPrice'])),
                    _detailRow('Adjusted Dynamic Price', money(adjustedSupply['adjustedPrice'])),
                    _detailRow('Effective Usable Units', '${adjustedSupply['effectiveUnits'] ?? 0} / ${supply['totalUnits'] ?? 0}'),
                    const SizedBox(height: 10),
                    const Text(
                      'IMPACT FACTORS',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black54),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        _factorChip('🌡️ Temp: ${factors['temperatureStress'] ?? 0}%'),
                        _factorChip('🌧️ Rain: ${factors['precipitationImpact'] ?? 0}%'),
                        _factorChip('💨 Wind: ${factors['windImpact'] ?? 0}%'),
                        _factorChip('⚡ Severity: ${factors['weatherSeverity'] ?? 1}/5'),
                      ],
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _kpiCol(String label, String value) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: ink)),
          Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.black54)),
        ],
      ),
    );
  }

  Widget _gaugeRow(String label, double value, Color color) {
    final pct = (value.abs() / 50.0).clamp(0.0, 1.0);
    return Row(
      children: [
        SizedBox(
          width: 75,
          child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.black87)),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: pct,
              minHeight: 8,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 45,
          child: Text(
            '${value > 0 ? '+' : ''}${value.round()}%',
            textAlign: TextAlign.end,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: color),
          ),
        ),
      ],
    );
  }

  Widget _detailRow(String title, String val, {Color? valColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.black87)),
          Text(val, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: valColor ?? ink)),
        ],
      ),
    );
  }

  Widget _factorChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ink.withValues(alpha: 0.2), width: 1),
      ),
      child: Text(text, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: ink)),
    );
  }
}

// ==========================================
// 7. CASCADING EFFECTS TIMELINE WIDGET
// ==========================================
class _CascadingEffectsWidget extends StatelessWidget {
  const _CascadingEffectsWidget({required this.effects});
  final List<Json> effects;

  @override
  Widget build(BuildContext context) {
    if (effects.isEmpty) return const SizedBox.shrink();

    return Panel(
      color: card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.flash_on, size: 20, color: ink),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Cascading Effects Propagation',
                  style: TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w900, fontSize: 15),
                ),
              ),
              _neoBadge('${effects.length} chains detected'),
            ],
          ),
          const SizedBox(height: 14),
          ...effects.map((eff) {
            final order = eff['order']?.toString() ?? '1';
            final magnitude = eff['magnitude']?.toString() ?? 'moderate';
            Color magColor;
            if (magnitude == 'extreme') {
              magColor = const Color(0xFF9C27B0);
            } else if (magnitude == 'severe') {
              magColor = const Color(0xFFF44336);
            } else if (magnitude == 'moderate') {
              magColor = const Color(0xFFFF9800);
            } else {
              magColor = const Color(0xFF4CAF50);
            }

            final affected = (eff['affected'] as List?)?.map((e) => e.toString()).toList() ?? [];

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: paperCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: ink.withValues(alpha: 0.18), width: 1.2),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: yellow,
                      shape: BoxShape.circle,
                      border: Border.all(color: ink, width: 1.4),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '$order°',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: ink),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              eff['trigger']?.toString() ?? '',
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: ink),
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 4),
                              child: Icon(Icons.arrow_forward, size: 12, color: ink),
                            ),
                            Expanded(
                              child: Text(
                                eff['effect']?.toString() ?? '',
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Color(0xFFD32F2F)),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          eff['description']?.toString() ?? '',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey.shade800),
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 4,
                          runSpacing: 4,
                          children: [
                            ...affected.map((a) => Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: sky.withValues(alpha: 0.5),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: ink.withValues(alpha: 0.2), width: 1),
                                  ),
                                  child: Text(
                                    a.replaceAll('_', ' '),
                                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: ink),
                                  ),
                                )),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: magColor,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                magnitude.toUpperCase(),
                                style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ==========================================
// 8. WHAT-IF COUNTERFACTUAL SIMULATOR
// ==========================================
class _WhatIfSimulatorWidget extends StatefulWidget {
  const _WhatIfSimulatorWidget({
    required this.api,
    required this.city,
    required this.baseWeather,
  });
  final Api api;
  final String city;
  final Json baseWeather;

  @override
  State<_WhatIfSimulatorWidget> createState() => _WhatIfSimulatorWidgetState();
}

class _WhatIfSimulatorWidgetState extends State<_WhatIfSimulatorWidget> {
  List<Json> _presets = [];
  Json? _activePreset;
  Json? _simulationResult;
  bool _loading = false;

  double _temp = 30.0;
  double _rain = 0.0;
  double _wind = 10.0;
  double _humidity = 65.0;
  int _weatherCode = 0;

  final Map<int, String> _weatherOptions = const {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Dense Fog',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain / Monsoon',
    82: 'Violent cloudburst showers',
    95: 'Thunderstorm',
    99: 'Severe Thunderstorm + Hail',
  };

  @override
  void initState() {
    super.initState();
    _fetchPresets();
    _initBaseWeather();
  }

  @override
  void didUpdateWidget(covariant _WhatIfSimulatorWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.baseWeather != widget.baseWeather) {
      _initBaseWeather();
    }
  }

  void _initBaseWeather() {
    if (widget.baseWeather.isNotEmpty) {
      setState(() {
        _temp = ((widget.baseWeather['temperature'] as num?)?.toDouble() ?? 30.0).clamp(-5.0, 52.0);
        _rain = ((widget.baseWeather['precipitation'] as num?)?.toDouble() ?? 0.0).clamp(0.0, 150.0);
        _wind = ((widget.baseWeather['windSpeed'] as num?)?.toDouble() ?? 10.0).clamp(0.0, 130.0);
        _humidity = ((widget.baseWeather['humidity'] as num?)?.toDouble() ?? 65.0).clamp(10.0, 100.0);
        _weatherCode = (widget.baseWeather['weatherCode'] as num?)?.toInt() ?? 0;
      });
    }
  }

  Future<void> _fetchPresets() async {
    try {
      final res = await widget.api.call('/digital-twin/presets');
      if (mounted) setState(() => _presets = records(res));
    } catch (_) {}
  }

  Future<void> _runSimulation([Json? preset]) async {
    setState(() {
      _loading = true;
      _activePreset = preset;
    });
    try {
      final body = preset != null
          ? {'city': widget.city, 'preset': preset['id']}
          : {
              'city': widget.city,
              'overrides': {
                'temperature': _temp,
                'precipitation': _rain,
                'windSpeed': _wind,
                'humidity': _humidity,
                'weatherCode': _weatherCode,
              },
            };

      final data = await widget.api.call('/digital-twin/simulate', method: 'POST', body: body);
      if (mounted) {
        setState(() {
          _simulationResult = Map<String, dynamic>.from(data is Map ? data : {});
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Simulation error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Panel(
      color: card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.layers_outlined, size: 20, color: ink),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'What-If Counterfactual Simulator',
                  style: TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w900, fontSize: 15),
                ),
              ),
              _neoBadge('AI SIMULATION', bg: orange),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Manipulate environmental parameters to simulate counterfactual weather disruptions across bookings, supply chains, dynamic pricing, and asset utilization.',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey.shade700),
          ),
          const SizedBox(height: 14),

          // Preset Buttons
          if (_presets.isNotEmpty) ...[
            const Text(
              'SCENARIO PRESETS',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black54),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _presets.map((p) {
                final isSelected = _activePreset?['id'] == p['id'];
                return InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: _loading ? null : () => _runSimulation(p),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? yellow : paperCard,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: ink, width: 1.4),
                      boxShadow: isSelected
                          ? const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))]
                          : null,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          p['name']?.toString() ?? '',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: ink),
                        ),
                        Text(
                          p['description']?.toString() ?? '',
                          style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 14),
          ],

          // Parameter Sliders
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: paperCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ink.withValues(alpha: 0.15), width: 1.2),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CUSTOM ENVIRONMENTAL PARAMETERS',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: ink),
                ),
                const SizedBox(height: 8),
                _sliderTile('🌡️ Temperature: ${_temp.round()}°C', _temp, -5.0, 52.0, (v) => setState(() => _temp = v)),
                _sliderTile('🌧️ Precipitation / Rain: ${_rain.round()}mm', _rain, 0.0, 150.0, (v) => setState(() => _rain = v)),
                _sliderTile('💨 Wind Speed: ${_wind.round()}km/h', _wind, 0.0, 130.0, (v) => setState(() => _wind = v)),
                _sliderTile('💧 Humidity: ${_humidity.round()}%', _humidity, 10.0, 100.0, (v) => setState(() => _humidity = v)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Text('☁️ Condition:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: ink)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: card,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: ink, width: 1.2),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<int>(
                            value: _weatherOptions.containsKey(_weatherCode) ? _weatherCode : 0,
                            isExpanded: true,
                            items: _weatherOptions.entries.map((e) {
                              return DropdownMenuItem<int>(
                                value: e.key,
                                child: Text(e.value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                              );
                            }).toList(),
                            onChanged: (v) {
                              if (v != null) setState(() => _weatherCode = v);
                            },
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Run Simulation Button
          NeoButton(
            text: _loading ? 'Simulating Virtual Twin...' : '▶ Run What-If Digital Twin Simulation',
            color: orange,
            fontSize: 13,
            padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 16),
            onPressed: _loading ? null : () => _runSimulation(null),
          ),

          // Simulation Results Presentation
          if (_simulationResult != null) ...[
            const SizedBox(height: 18),
            _SimulationResultView(result: _simulationResult!),
          ],
        ],
      ),
    );
  }

  Widget _sliderTile(String label, double value, double min, double max, ValueChanged<double> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: ink)),
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            activeTrackColor: ink,
            inactiveTrackColor: Colors.grey.shade300,
            thumbColor: yellow,
            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
            trackHeight: 3,
          ),
          child: Slider(
            value: value,
            min: min,
            max: max,
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }
}

// ==========================================
// SIMULATION RESULT VIEW & CHARTS
// ==========================================
class _SimulationResultView extends StatelessWidget {
  const _SimulationResultView({required this.result});
  final Json result;

  @override
  Widget build(BuildContext context) {
    final scenario = (result['scenario'] as Map?)?.cast<String, dynamic>() ?? {};
    final baseWeather = (scenario['baseWeather'] as Map?)?.cast<String, dynamic>() ?? {};
    final simWeather = (scenario['simulatedWeather'] as Map?)?.cast<String, dynamic>() ?? {};
    final comparison = (result['comparison'] as Map?)?.cast<String, dynamic>() ?? {};
    final cascading = (result['cascadingEffects'] as Map?)?.cast<String, dynamic>() ?? {};
    final newCascades = records(cascading['newEffects']);
    final recommendations = records(result['recommendations']);

    final catList = comparison.entries.toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Current vs Simulated Weather Header
        Row(
          children: [
            Expanded(
              child: _weatherBox('CURRENT', baseWeather, const Color(0xFF4CAF50)),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 6),
              child: Icon(Icons.arrow_forward, size: 18, color: ink),
            ),
            Expanded(
              child: _weatherBox('SIMULATED', simWeather, const Color(0xFFF44336)),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Sensitivity Radar Chart
        if (catList.isNotEmpty) ...[
          const Text(
            'Multi-Dimensional Sensitivity Radar',
            style: TextStyle(fontFamily: 'SpaceGrotesk', fontSize: 13, fontWeight: FontWeight.w900, color: ink),
          ),
          const SizedBox(height: 8),
          Container(
            height: 240,
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: paperCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ink.withValues(alpha: 0.18), width: 1.2),
            ),
            child: CustomPaint(
              size: Size.infinite,
              painter: _SensitivityRadarPainter(categories: catList),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _legendDot(const Color(0xFFF44336), 'Demand Δ'),
              const SizedBox(width: 12),
              _legendDot(const Color(0xFFFF9800), 'Risk Δ'),
              const SizedBox(width: 12),
              _legendDot(const Color(0xFF2196F3), 'Supply Δ'),
            ],
          ),
          const SizedBox(height: 14),
        ],

        // Demand vs Supply Delta Bar Chart
        if (catList.isNotEmpty) ...[
          const Text(
            'Category Demand vs Supply Delta (%)',
            style: TextStyle(fontFamily: 'SpaceGrotesk', fontSize: 13, fontWeight: FontWeight.w900, color: ink),
          ),
          const SizedBox(height: 8),
          Container(
            height: 200,
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: paperCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ink.withValues(alpha: 0.18), width: 1.2),
            ),
            child: CustomPaint(
              size: Size.infinite,
              painter: _DeltaBarChartPainter(categories: catList),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _legendDot(const Color(0xFFF44336), 'Demand Shift %'),
              const SizedBox(width: 12),
              _legendDot(const Color(0xFF2196F3), 'Supply Shift %'),
            ],
          ),
          const SizedBox(height: 14),
        ],

        // Category Comparison Cards Grid
        const Text(
          'CATEGORY RESILIENCE METRICS',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.black54),
        ),
        const SizedBox(height: 8),
        ...catList.map((entry) {
          final cat = entry.key;
          final comp = (entry.value as Map?)?.cast<String, dynamic>() ?? {};
          final demandDelta = (comp['demandDelta'] as num?)?.toDouble() ?? 0.0;
          final supplyDelta = (comp['supplyDelta'] as num?)?.toDouble() ?? 0.0;
          final riskDelta = (comp['riskDelta'] as num?)?.toDouble() ?? 0.0;
          final baseRisk = comp['baseRisk']?.toString() ?? 'normal';
          final simRisk = comp['simulatedRisk']?.toString() ?? 'critical';

          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: card,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: ink.withValues(alpha: 0.15), width: 1.2),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      cat.replaceAll('_', ' ').toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: ink),
                    ),
                    Row(
                      children: [
                        Text(
                          baseRisk,
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: riskColors[baseRisk] ?? const Color(0xFF4CAF50)),
                        ),
                        const Icon(Icons.arrow_forward, size: 10, color: ink),
                        Text(
                          simRisk,
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: riskColors[simRisk] ?? const Color(0xFFF44336)),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    _deltaPill('Demand', demandDelta),
                    _deltaPill('Supply', supplyDelta),
                    _deltaPill('Risk', riskDelta),
                  ],
                ),
              ],
            ),
          );
        }),

        // New Cascading Effects Triggered
        if (newCascades.isNotEmpty) ...[
          const SizedBox(height: 12),
          const Text(
            '⚡ NEW CASCADING EFFECTS TRIGGERED',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFFD32F2F)),
          ),
          const SizedBox(height: 8),
          ...newCascades.map((eff) {
            return Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFEBEE),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFF44336), width: 1.2),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: const Color(0xFFF44336), borderRadius: BorderRadius.circular(6)),
                    child: Text('${eff['order']}°', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white)),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${eff['trigger']} → ${eff['effect']}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: ink)),
                        Text(eff['description']?.toString() ?? '', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.grey.shade800)),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],

        // AI Recommendations
        if (recommendations.isNotEmpty) ...[
          const SizedBox(height: 14),
          const Text(
            '📋 AI CONTINGENCY RECOMMENDATIONS',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: ink),
          ),
          const SizedBox(height: 8),
          ...recommendations.map((rec) {
            final pri = rec['priority']?.toString() ?? 'medium';
            Color priColor;
            if (pri == 'high') {
              priColor = const Color(0xFFD32F2F);
            } else if (pri == 'medium') {
              priColor = const Color(0xFFE65100);
            } else {
              priColor = const Color(0xFF2E7D32);
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: paperCard,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: ink.withValues(alpha: 0.18), width: 1.2),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: priColor, borderRadius: BorderRadius.circular(6)),
                        child: Text(pri.toUpperCase(), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white)),
                      ),
                      const SizedBox(width: 6),
                      Text((rec['type']?.toString() ?? '').replaceAll('_', ' ').toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.black54)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(rec['action']?.toString() ?? '', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: ink)),
                ],
              ),
            );
          }),
        ],
      ],
    );
  }

  Widget _weatherBox(String title, Json weather, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: paperCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: ink.withValues(alpha: 0.2), width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.black54)),
          Text('${weather['temperature'] ?? 28}°C', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: ink)),
          Text(weather['desc']?.toString() ?? '', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.black87), overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }

  Widget _deltaPill(String label, double val) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 2),
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
        decoration: BoxDecoration(
          color: paperCard,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Column(
          children: [
            Text(label, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: Colors.black54)),
            Text(
              '${val > 0 ? '+' : ''}${val.round()}%',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: val < 0 ? const Color(0xFFF44336) : val > 0 ? const Color(0xFF4CAF50) : ink,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: ink)),
      ],
    );
  }
}

// Multi-Dimensional Sensitivity Radar Painter
class _SensitivityRadarPainter extends CustomPainter {
  _SensitivityRadarPainter({required this.categories});
  final List<MapEntry<String, dynamic>> categories;

  @override
  void paint(Canvas canvas, Size size) {
    final count = categories.length;
    if (count < 3) return;

    final cx = size.width / 2;
    final cy = size.height / 2;
    final radius = math.min(cx, cy) - 28;

    final axisPaint = Paint()
      ..color = const Color(0xFFE5E0CF)
      ..strokeWidth = 1.0;

    // Draw concentric polygon rings
    for (var r = 1; r <= 3; r++) {
      final ringR = radius * (r / 3);
      final ringPath = Path();
      for (var i = 0; i < count; i++) {
        final angle = (i * 2 * math.pi / count) - math.pi / 2;
        final x = cx + ringR * math.cos(angle);
        final y = cy + ringR * math.sin(angle);
        if (i == 0) {
          ringPath.moveTo(x, y);
        } else {
          ringPath.lineTo(x, y);
        }
      }
      ringPath.close();
      canvas.drawPath(ringPath, axisPaint..style = PaintingStyle.stroke);
    }

    // Draw spokes and labels
    for (var i = 0; i < count; i++) {
      final angle = (i * 2 * math.pi / count) - math.pi / 2;
      final x = cx + radius * math.cos(angle);
      final y = cy + radius * math.sin(angle);
      canvas.drawLine(Offset(cx, cy), Offset(x, y), axisPaint);

      // Label
      final catName = categories[i].key.replaceAll('_', ' ');
      final shortName = catName.length > 7 ? catName.substring(0, 7) : catName;
      final lx = cx + (radius + 16) * math.cos(angle);
      final ly = cy + (radius + 16) * math.sin(angle);
      final tp = TextPainter(
        text: TextSpan(
          text: shortName,
          style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: Colors.black87),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(lx - tp.width / 2, ly - tp.height / 2));
    }

    // Draw Radar Polygons for Demand, Risk, Supply
    _drawRadarPolygon(canvas, cx, cy, radius, count, 'demandDelta', const Color(0xFFF44336), 0.25);
    _drawRadarPolygon(canvas, cx, cy, radius, count, 'riskDelta', const Color(0xFFFF9800), 0.2);
    _drawRadarPolygon(canvas, cx, cy, radius, count, 'supplyDelta', const Color(0xFF2196F3), 0.2);
  }

  void _drawRadarPolygon(Canvas canvas, double cx, double cy, double radius, int count, String key, Color color, double opacity) {
    final polyPath = Path();
    for (var i = 0; i < count; i++) {
      final comp = (categories[i].value as Map?)?.cast<String, dynamic>() ?? {};
      final val = ((comp[key] as num?)?.toDouble() ?? 0.0).abs();
      final scaled = (val / 50.0).clamp(0.1, 1.0) * radius;
      final angle = (i * 2 * math.pi / count) - math.pi / 2;
      final x = cx + scaled * math.cos(angle);
      final y = cy + scaled * math.sin(angle);

      if (i == 0) {
        polyPath.moveTo(x, y);
      } else {
        polyPath.lineTo(x, y);
      }
    }
    polyPath.close();

    canvas.drawPath(polyPath, Paint()..color = color.withValues(alpha: opacity)..style = PaintingStyle.fill);
    canvas.drawPath(polyPath, Paint()..color = color..strokeWidth = 1.6..style = PaintingStyle.stroke);
  }

  @override
  bool shouldRepaint(covariant _SensitivityRadarPainter oldDelegate) {
    return oldDelegate.categories != categories;
  }
}

// Category Demand vs Supply Delta Bar Chart Painter
class _DeltaBarChartPainter extends CustomPainter {
  _DeltaBarChartPainter({required this.categories});
  final List<MapEntry<String, dynamic>> categories;

  @override
  void paint(Canvas canvas, Size size) {
    final count = categories.length;
    if (count == 0) return;

    final centerY = size.height / 2;
    final barWidth = (size.width / count) * 0.35;
    final groupWidth = size.width / count;

    // Zero line
    canvas.drawLine(
      Offset(0, centerY),
      Offset(size.width, centerY),
      Paint()..color = const Color(0xFF171915)..strokeWidth = 1.2,
    );

    for (var i = 0; i < count; i++) {
      final comp = (categories[i].value as Map?)?.cast<String, dynamic>() ?? {};
      final demand = (comp['demandDelta'] as num?)?.toDouble() ?? 0.0;
      final supply = (comp['supplyDelta'] as num?)?.toDouble() ?? 0.0;

      final groupX = i * groupWidth + (groupWidth / 2);

      // Demand bar (Red)
      final dHeight = (demand / 50.0).clamp(-1.0, 1.0) * (size.height / 2 - 16);
      final dRect = Rect.fromLTWH(
        groupX - barWidth - 1,
        dHeight < 0 ? centerY : centerY - dHeight,
        barWidth,
        dHeight.abs(),
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(dRect, const Radius.circular(3)),
        Paint()..color = const Color(0xFFF44336),
      );

      // Supply bar (Blue)
      final sHeight = (supply / 50.0).clamp(-1.0, 1.0) * (size.height / 2 - 16);
      final sRect = Rect.fromLTWH(
        groupX + 1,
        sHeight < 0 ? centerY : centerY - sHeight,
        barWidth,
        sHeight.abs(),
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(sRect, const Radius.circular(3)),
        Paint()..color = const Color(0xFF2196F3),
      );

      // Label below or above
      final catName = categories[i].key.replaceAll('_', ' ');
      final shortName = catName.length > 5 ? catName.substring(0, 5) : catName;
      final tp = TextPainter(
        text: TextSpan(
          text: shortName,
          style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: Colors.black87),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(groupX - tp.width / 2, size.height - 10));
    }
  }

  @override
  bool shouldRepaint(covariant _DeltaBarChartPainter oldDelegate) {
    return oldDelegate.categories != categories;
  }
}

// ==========================================
// 9. REAL-WORLD SOCIAL & PUBLIC SIGNAL PULSE
// ==========================================
class _SocialPulseWidget extends StatefulWidget {
  const _SocialPulseWidget({required this.social});
  final Json social;

  @override
  State<_SocialPulseWidget> createState() => _SocialPulseWidgetState();
}

class _SocialPulseWidgetState extends State<_SocialPulseWidget> {
  String _sourceFilter = 'all';
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    if (widget.social.isEmpty) return const SizedBox.shrink();

    final allSignals = records(widget.social['signals']);
    final breakdown = (widget.social['sentimentBreakdown'] as Map?)?.cast<String, dynamic>() ?? {};
    final sourceBreakdown = (widget.social['sourceBreakdown'] as Map?)?.cast<String, dynamic>() ?? {};
    final trending = records(widget.social['trendingTopics']);

    final filtered = allSignals.where((s) {
      final src = s['sourceType']?.toString() ?? 'citizen_pulse';
      if (_sourceFilter == 'news') return src == 'live_news';
      if (_sourceFilter == 'reddit') return src == 'reddit_community';
      if (_sourceFilter == 'pulse') return src != 'live_news' && src != 'reddit_community';
      return true;
    }).toList();

    final displaySignals = _expanded ? filtered : filtered.take(6).toList();

    return Panel(
      color: card,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.forum_outlined, size: 20, color: ink),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Real-World Social & Public Signal Pulse',
                  style: TextStyle(fontFamily: 'SpaceGrotesk', fontWeight: FontWeight.w900, fontSize: 15),
                ),
              ),
              _neoBadge('${widget.social['relevantCount'] ?? allSignals.length} live signals', bg: mint),
            ],
          ),
          const SizedBox(height: 12),

          // Source filter buttons
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _filterTab('All (${allSignals.length})', _sourceFilter == 'all', () => setState(() => _sourceFilter = 'all')),
                _filterTab('📰 Live News (${sourceBreakdown['liveNews'] ?? 0})', _sourceFilter == 'news', () => setState(() => _sourceFilter = 'news')),
                _filterTab('💬 Reddit (${sourceBreakdown['reddit'] ?? 0})', _sourceFilter == 'reddit', () => setState(() => _sourceFilter = 'reddit')),
                _filterTab('📡 Traveler Pulse (${sourceBreakdown['citizenPulse'] ?? 0})', _sourceFilter == 'pulse', () => setState(() => _sourceFilter = 'pulse')),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Sentiment Breakdown Pills
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _sentimentPill('🟢 ${breakdown['positive'] ?? 0} Favorable', const Color(0xFFE8F5E9), const Color(0xFF2E7D32)),
              _sentimentPill('⚪ ${breakdown['neutral'] ?? 0} Neutral', const Color(0xFFF5F5F5), const Color(0xFF616161)),
              _sentimentPill('🔴 ${breakdown['negative'] ?? 0} Disruption Alerts', const Color(0xFFFFEBEE), const Color(0xFFC62828)),
            ],
          ),
          const SizedBox(height: 10),

          // Trending Topics Chips
          if (trending.isNotEmpty) ...[
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 3),
                  child: Text('Trending:', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.black54)),
                ),
                ...trending.take(6).map((t) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: paperCard,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: ink.withValues(alpha: 0.15), width: 1),
                      ),
                      child: Text(
                        '#${t['word']} (${t['count']})',
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: ink),
                      ),
                    )),
              ],
            ),
            const SizedBox(height: 12),
          ],

          // Signal List
          ...displaySignals.map((s) {
            final sent = (s['sentiment'] as Map?)?.cast<String, dynamic>() ?? {};
            final emoji = sent['emoji']?.toString() ?? '⚪';
            final title = s['title']?.toString() ?? '';
            final url = s['url']?.toString();
            final srcType = s['sourceType']?.toString() ?? 'pulse';
            final srcLabel = srcType == 'live_news'
                ? '📰 Live News'
                : srcType == 'reddit_community'
                    ? 'r/${s['subreddit'] ?? 'travel'}'
                    : '📡 Traveler Pulse';

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: paperCard,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: ink.withValues(alpha: 0.15), width: 1.2),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(emoji, style: const TextStyle(fontSize: 14)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: InkWell(
                          onTap: (url != null && url.startsWith('http'))
                              ? () => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication)
                              : null,
                          child: Text(
                            title,
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 12,
                              color: (url != null && url.startsWith('http')) ? const Color(0xFF1565C0) : ink,
                              decoration: (url != null && url.startsWith('http')) ? TextDecoration.underline : null,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: sky.withValues(alpha: 0.4),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: ink.withValues(alpha: 0.15), width: 1),
                        ),
                        child: Text(
                          srcLabel,
                          style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: ink),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    children: [
                      Text(s['author'] != null ? 'By ${s['author']}' : 'Verified Signal', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: Colors.black54)),
                      Text('⬆️ ${s['score'] ?? 0} impact', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: Colors.black54)),
                      Text('💬 ${s['numComments'] ?? 0} comments', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: Colors.black54)),
                    ],
                  ),
                ],
              ),
            );
          }),

          // Show More / Fewer
          if (filtered.length > 6)
            Center(
              child: TextButton(
                onPressed: () => setState(() => _expanded = !_expanded),
                child: Text(
                  _expanded ? 'Show fewer signals' : 'Show all ${filtered.length} signals',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: ink),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _filterTab(String label, bool active, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: active ? yellow : paperCard,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: ink, width: 1.2),
            boxShadow: active ? const [BoxShadow(color: ink, offset: Offset(1.5, 1.5))] : null,
          ),
          child: Text(
            label,
            style: TextStyle(fontSize: 10, fontWeight: active ? FontWeight.w900 : FontWeight.w700, color: ink),
          ),
        ),
      ),
    );
  }

  Widget _sentimentPill(String label, Color bg, Color text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: text.withValues(alpha: 0.3), width: 1),
      ),
      child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: text)),
    );
  }
}
