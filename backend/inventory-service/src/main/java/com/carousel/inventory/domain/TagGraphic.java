package com.carousel.inventory.domain;

import java.util.Arrays;
import java.util.Locale;

public enum TagGraphic {
    Diamond("💎"),
    Bullion("🪙"),
    Cast("🧩"),
    Chain("🔗"),
    Gear("⚙"),
    Ruler("📏"),
    Thread("🧵"),
    Box("📦"),
    Gem("🔷"),
    Ingot("🥇"),
    Anvil("⚒"),
    Crucible("🏺"),
    Spark("✨"),
    Shield("🛡"),
    Star("⭐"),
    Flame("🔥"),
    Droplet("💧"),
    Leaf("🍃");

    private final String icon;

    TagGraphic(String icon) {
        this.icon = icon;
    }

    public String getIcon() {
        return icon;
    }

    public static TagGraphic fromTextOrDefault(String value, TagGraphic fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }

        String normalized = value.trim();

        return Arrays.stream(values())
                .filter(graphic -> graphic.name().equalsIgnoreCase(normalized) || graphic.icon.equals(normalized))
                .findFirst()
                .orElse(fallback);
    }

    public String getDisplayName() {
        String raw = name();
        return raw.substring(0, 1).toUpperCase(Locale.ROOT) + raw.substring(1);
    }
}
