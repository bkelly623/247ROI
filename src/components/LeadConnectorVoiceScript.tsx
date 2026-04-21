"use client";

import Script from "next/script";
import {
  GHL_VOICE_WIDGET_ID,
  GHL_VOICE_WIDGET_RESOURCES_URL,
  GHL_VOICE_WIDGET_SCRIPT_SRC,
} from "@/lib/ghlVoiceWidget";

/**
 * Loads the GHL Voice / chat widget once for the whole app.
 * The widget UI may still anchor visually (e.g. bottom-right); the hero card
 * provides the primary on-brand entry point to open it.
 */
export default function LeadConnectorVoiceScript() {
  return (
    <Script
      id="leadconnector-voice-widget"
      src={GHL_VOICE_WIDGET_SCRIPT_SRC}
      strategy="afterInteractive"
      data-resources-url={GHL_VOICE_WIDGET_RESOURCES_URL}
      data-widget-id={GHL_VOICE_WIDGET_ID}
    />
  );
}
