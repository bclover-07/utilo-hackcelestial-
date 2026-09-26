import 'package:flutter/material.dart';

const ink = Color(0xff171915),
    paper = Color(0xfffff9eb),
    card = Color(0xfffffef8),
    paperCard = Color(0xfffffef8),
    yellow = Color(0xfff8dc60),
    teal = Color(0xff79d9c5),
    lavender = Color(0xffc9b5ee),
    pink = Color(0xfff7a7c2),
    sky = Color(0xffa5d9f5),
    orange = Color(0xffffb36d),
    lime = Color(0xffd2ea81),
    mint = Color(0xffb9e5c4),
    coral = Color(0xfff58e7e),
    peach = Color(0xfff9c8a3),
    lilac = Color(0xffdcd2ff),
    indigo = Color(0xffa7b6ef);

const palette = [yellow, teal, lavender, pink, sky, orange, lime, mint, coral, peach, lilac, indigo];

const neoShadowSm = [BoxShadow(color: ink, offset: Offset(1.5, 1.5))];
const neoShadowMd = [BoxShadow(color: ink, offset: Offset(2, 2.5))];
const neoShadowLg = [BoxShadow(color: ink, offset: Offset(2.5, 3))];
const neoShadowXl = [BoxShadow(color: ink, offset: Offset(3.5, 4))];

ThemeData utlioTheme() {
  final base = ThemeData(
    useMaterial3: true,
    fontFamily: 'DMSans',
    scaffoldBackgroundColor: paper,
    colorScheme: ColorScheme.fromSeed(
      seedColor: teal,
      primary: ink,
      surface: paper,
    ),
  );
  final border = OutlineInputBorder(
    borderRadius: BorderRadius.circular(14),
    borderSide: const BorderSide(color: ink, width: 1.5),
  );
  return base.copyWith(
    textTheme: base.textTheme.copyWith(
      headlineLarge: const TextStyle(
        fontFamily: 'SpaceGrotesk',
        fontSize: 38,
        fontWeight: FontWeight.w800,
        height: 1.08,
        color: ink,
      ),
      headlineMedium: const TextStyle(
        fontFamily: 'SpaceGrotesk',
        fontSize: 27,
        fontWeight: FontWeight.w700,
        color: ink,
      ),
      titleLarge: const TextStyle(
        fontFamily: 'SpaceGrotesk',
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: ink,
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: paper,
      foregroundColor: ink,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: card,
      border: border,
      enabledBorder: border,
      focusedBorder: border.copyWith(
        borderSide: const BorderSide(color: ink, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: yellow,
        foregroundColor: ink,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        side: const BorderSide(color: ink, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
        textStyle: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'SpaceGrotesk', fontSize: 15),
        elevation: 0,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: ink,
        backgroundColor: card,
        side: const BorderSide(color: ink, width: 1.5),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
        textStyle: const TextStyle(fontWeight: FontWeight.w800, fontFamily: 'DMSans'),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: lavender,
      side: const BorderSide(color: ink, width: 1.2),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    scrollbarTheme: ScrollbarThemeData(
      thumbColor: const WidgetStatePropertyAll(yellow),
      trackColor: const WidgetStatePropertyAll(Color(0xfffff4d4)),
      trackBorderColor: const WidgetStatePropertyAll(ink),
      thickness: const WidgetStatePropertyAll(9),
      radius: const Radius.circular(8),
      thumbVisibility: const WidgetStatePropertyAll(true),
    ),
    snackBarTheme: const SnackBarThemeData(
      backgroundColor: ink,
      behavior: SnackBarBehavior.floating,
    ),
  );
}
