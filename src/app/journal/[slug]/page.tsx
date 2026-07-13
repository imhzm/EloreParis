import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CinematicDetailStage } from "@/components/cinematic-detail-stage";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackedLink } from "@/components/tracked-link";
import {
  absoluteUrl,
  collectionDirectory,
  getConcernByHref,
  getIngredientByHref,
  getIngredientByName,
  getProductByHref,
  getRoutineByHref,
  journalArticles,
} from "@/lib/site-content";
import styles from "../journal.module.css";

const issueDirectory: Record<string, string> = {
  "Issue 01":
    "Ø§Ù„Ø¯ÙØ¹Ø© Ø§Ù„Ø§ÙØªØªØ§Ø­ÙŠØ© Ø§Ù„ØªÙŠ Ø«Ø¨Ù‘ØªØª pillars Ø§Ù„Ù…Ø¬Ù„Ø© ÙˆØ±Ø¨Ø·Øª Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© Ø¨Ø§Ù„Ø³Ø·ÙˆØ­ Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ© Ø§Ù„Ø£ÙˆÙ„Ù‰.",
  "Issue 02":
    "Ø¯ÙØ¹Ø© Ø§Ù„ØªÙˆØ³Ù‘Ø¹ Ø§Ù„ØªÙŠ ØªØ±Ø¨Ø· Ø§Ù„Ø³ÙŠØ§Ù‚ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠ ÙˆÙ…Ø¬Ù…ÙˆØ¹Ø§Øª Ø§Ù„Ø¬Ù…Ø§Ù„ Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© Ø¨Ø³Ø·ÙˆØ­ beauty-sets Ùˆtools Ùˆhaircare Ùˆbodycare.",
  "Issue 03":
    "Ø¯ÙØ¹Ø© Ù‚Ø±Ø§Ø± ØªØ±ÙƒÙ‘Ø² Ø¹Ù„Ù‰ ØªÙ‡Ø¯Ø¦Ø© Ø§Ù„Ø­Ø³Ø§Ø³ÙŠØ©ØŒ Ø¥Ø¯Ø®Ø§Ù„ ÙÙŠØªØ§Ù…ÙŠÙ† C Ø¨ÙˆØ¹ÙŠ ØµØ¨Ø§Ø­ÙŠØŒ ØªØ­Ø³ÙŠÙ† Ù…Ù†Ø·Ù‚ Ø´Ø±Ø§Ø¡ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø§ØªØŒ ÙˆØµÙŠØ§ØºØ© Ù‡Ø¯Ø§ÙŠØ§ Ø£Ù‚Ø±Ø¨ Ù„Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„ÙØ¹Ù„ÙŠ.",
  "Issue 04":
    "Ø¯ÙØ¹Ø© ØªØ±Ø³ÙŠØ® ØªØ±ÙƒÙ‘Ø² Ø¹Ù„Ù‰ ØªØ¨Ø³ÙŠØ· Ø§Ù„ØªÙ†ÙÙŠØ° Ø§Ù„ÙŠÙˆÙ…ÙŠ: Ø±ÙˆØªÙŠÙ† Ù…Ø³Ø§Ø¦ÙŠ Ø£ÙˆØ¶Ø­ØŒ Ø«Ø¨Ø§Øª Ù…ÙƒÙŠØ§Ø¬ Ø£Ø®ÙØŒ ÙÙ‡Ù… Ù…Ø­Ù„ÙŠ Ø£Ø¯Ù‚ Ù„Ù„Ù‡ÙŠØ§Ù„ÙˆØ±ÙˆÙ†ÙŠÙƒ Ø£Ø³ÙŠØ¯ØŒ ÙˆØ¨Ø¯Ø§ÙŠØ© Ø´Ø±Ø§Ø¡ Ø£ÙƒØ«Ø± Ø¹Ù‚Ù„Ø§Ù†ÙŠØ© ÙÙŠ beauty-sets.",
  "Issue 05":
    "Ø¯ÙØ¹Ø© Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù‚Ø±Ø§Ø± Ø¨Ø¹Ø¯ Ø£ÙˆÙ„ Ø§Ø³ØªØ®Ø¯Ø§Ù…: Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„ØªØµØ¨ØºØ§Øª Ø¨Ø¹Ø¯ 30 ÙŠÙˆÙ…ØŒ ÙØµÙ„ Ø§Ø®ØªÙŠØ§Ø±Ø§Øª longwear Ø¨ÙŠÙ† Ø§Ù„Ø¯ÙˆØ§Ù… ÙˆØ§Ù„Ù…Ù†Ø§Ø³Ø¨Ø©ØŒ ØªÙˆØ¶ÙŠØ­ pairing Ø¨ÙŠÙ† niacinamide Ùˆhyaluronic acidØŒ ÙˆØ¥Ø±Ø´Ø§Ø¯ Ø¹Ù…Ù„ÙŠ Ù„Ø§Ø®ØªÙŠØ§Ø± beauty-sets Ù„Ù„Ù‡Ø¯Ø§ÙŠØ§ Ø­Ø³Ø¨ Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ©.",
  "Issue 06":
    "Ø¯ÙØ¹Ø© ØªØ«Ø¨ÙŠØª Ù…Ø§ Ø¨Ø¹Ø¯ Ø§Ù„Ø´Ø±Ø§Ø¡: Ø§Ø³ØªÙ‚Ø±Ø§Ø± Ø§Ù„Ø¨Ø´Ø±Ø© Ø§Ù„Ø­Ø³Ø§Ø³Ø© Ù…Ø¹ ØªØºÙŠØ± Ø§Ù„Ø·Ù‚Ø³ØŒ ØªØ±ØªÙŠØ¨ Ø§Ù„ØªØ±Ø·ÙŠØ¨ Ø¨ÙŠÙ† Ø§Ù„ØªÙƒÙŠÙŠÙ ÙˆØ§Ù„Ø®Ø±ÙˆØ¬ØŒ Ø­Ø³Ù… Ù‚Ø±Ø§Ø± Ø§Ù„Ø­Ø²Ù… Ø¶Ø¯ Ø§Ù„Ø´Ø±Ø§Ø¡ Ø§Ù„ÙØ±Ø¯ÙŠØŒ ÙˆØ¨Ù†Ø§Ø¡ Ø§Ø³ØªÙ…Ø±Ø§Ø±ÙŠØ© Ø§Ù„Ø±ÙˆØªÙŠÙ† Ø¨Ø¹Ø¯ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„Ø«Ø§Ù†ÙŠ.",
  "Issue 07":
    "Ø¯ÙØ¹Ø© Ø§Ø³ØªÙ…Ø±Ø§Ø±ÙŠØ© Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„ÙŠÙˆÙ…ÙŠØ©: ØªØ¬Ø¯ÙŠØ¯ Ø§Ù„Ø­Ù…Ø§ÙŠØ© ÙÙˆÙ‚ Ø§Ù„Ù…ÙƒÙŠØ§Ø¬ Ø¨Ø¯ÙˆÙ† ØªÙƒØªÙ„ØŒ Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„Ø±ÙˆØªÙŠÙ† Ø¨Ø¹Ø¯ Ø§Ù„Ø§Ù†Ù‚Ø·Ø§Ø¹ØŒ ØªØ«Ø¨ÙŠØª Ù†Ø¸Ø§ÙØ© Ø§Ù„Ø£Ø¯ÙˆØ§ØªØŒ ÙˆØ¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø· Ø§Ù„Ù…Ø³Ø§Ø¡ Ø¨Ø¹Ø¯ Ø§Ù„Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ù…ØªØ£Ø®Ø±Ø©.",
  "Issue 08":
    "Ø¯ÙØ¹Ø© Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„ØªÙˆØ§Ø²Ù† Ø¨Ø¹Ø¯ Ø§Ø¶Ø·Ø±Ø§Ø¨ Ø§Ù„ÙŠÙˆÙ…: Ø¶Ø¨Ø· Ø§Ù„ØªØ±Ø·ÙŠØ¨ Ø¨ÙŠÙ† Ø§Ù„ØªÙƒÙŠÙŠÙ ÙˆØ§Ù„Ø­Ø±Ø§Ø±Ø©ØŒ ØªØ±ØªÙŠØ¨ Ø§Ù„ØªØ±Ø§Ø¬Ø¹ Ø¨Ø¹Ø¯ Ø§Ù„Ø¥ÙØ±Ø§Ø· ÙÙŠ Ø§Ù„Ø·Ø¨Ù‚Ø§ØªØŒ ØªØ­Ø¯ÙŠØ¯ ØªÙˆÙ‚ÙŠØª Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø´Ø±Ø§Ø¡ Ø¨ÙŠÙ† Ø§Ù„Ù…Ù†ØªØ¬ Ø§Ù„Ù…ÙØ±Ø¯ ÙˆØ§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©ØŒ ÙˆØ¨Ù†Ø§Ø¡ ØµØ¨Ø§Ø­ ØªØ¹ÙˆÙŠØ¶ÙŠ Ù‚ØµÙŠØ± Ø¨Ø¹Ø¯ Ù…Ø³Ø§Ø¡ Ù…Ø¶Ø·Ø±Ø¨.",
  "Issue 09":
    "Ø¯ÙØ¹Ø© Ø§Ø³ØªÙ…Ø±Ø§Ø±ÙŠØ© Ø§Ù„Ù…Ø³Ø§Ø±Ø§Øª Ø§Ù„ØªÙˆØ³Ø¹ÙŠØ©: Ù‚Ø±Ø§Ø± touch-up Ù…Ù‚Ø§Ø¨Ù„ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ±ØªÙŠØ¨ Ù‚Ø¨Ù„ Ø§Ù„Ù…Ø³Ø§Ø¡ØŒ Ø§Ø®ØªÙŠØ§Ø± gift set Ø­Ø³Ø¨ Ø§Ù„Ø³ÙŠÙ†Ø§Ø±ÙŠÙˆØŒ Ø§Ø³ØªØ¹Ø§Ø¯Ø© haircare Ø¨Ø¹Ø¯ Ø§Ù„Ø³ÙØ± Ø£Ùˆ ØªØºÙŠÙ‘Ø± Ø§Ù„Ø·Ù‚Ø³ØŒ ÙˆØ¨Ù†Ø§Ø¡ Ù†Ù‚Ø·Ø© Ø¹ÙˆØ¯Ø© Ø£ÙˆØ¶Ø­ Ù„Ø±ÙˆØªÙŠÙ† bodycare.",
  "Issue 10":
    "Ø¯ÙØ¹Ø© Ø¨Ù†Ø§Ø¡ Ø§Ù„Ø«Ù‚Ø© ÙˆØ§Ù„Ø§Ø¹ØªØ±Ø§Ø¶Ø§Øª: Ø«Ù‚Ø© Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø´Ø±Ø§Ø¡ Ø¨Ø¹Ø¯ Ù†Ø¬Ø§Ø­ ÙØ¹Ù„ÙŠØŒ proof Ø£ÙˆØ¶Ø­ Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ø§Ù„Ù…ÙƒÙŠØ§Ø¬ Ù…Ù† Ø§Ù„Ù†Ù‡Ø§Ø± Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø³Ø§Ø¡ØŒ fit notes ØªÙ‚Ù„Ù„ ØªØ±Ø¯Ø¯ haircareØŒ ÙˆØ§Ø³ØªÙ…Ø±Ø§Ø±ÙŠØ© bodycare Ø§Ù„ØªÙŠ ØªÙ‚ÙˆÙŠ Ø§Ù„ØªÙƒØ±Ø§Ø± Ø¨Ø¯ÙˆÙ† Ø´Ø±Ø§Ø¡ Ø²Ø§Ø¦Ø¯.",
  "Issue 11":
    "Ø¯ÙØ¹Ø© ØªØ±ØªÙŠØ¨ Ø§Ù„Ø¥Ø«Ø¨Ø§Øª Ù‚Ø¨Ù„ Ø§Ù„ØªÙˆØ³Ø¹: proof Ø£ÙˆØ¶Ø­ Ù„Ø±ÙˆØªÙŠÙ† skincare Ø§Ù„Ø°ÙŠ ÙŠØ¹Ù…Ù„ Ø¬Ø²Ø¦ÙŠÙ‹Ø§ØŒ Ø­Ù„ Ø§Ù„Ø§Ø¹ØªØ±Ø§Ø¶Ø§Øª Ø§Ù„ÙØ¹Ù„ÙŠØ© Ù‚Ø¨Ù„ Ø¥Ø¹Ø§Ø¯Ø© base makeup Ù…Ù† Ø§Ù„ØµÙØ±ØŒ ØªØ­ÙˆÙŠÙ„ Ø²ÙŠØ§Ø±Ø§Øª beauty-sets Ø¥Ù„Ù‰ next steps Ù…Ø­Ø¯Ø¯Ø©ØŒ ÙˆØ¨Ù†Ø§Ø¡ Ù…Ù†Ø·Ù‚ repeat-use Ø¯Ø§Ø®Ù„ bodycare Ù‚Ø¨Ù„ Ø£ÙŠ ØªÙˆØ³Ø¹ Ø¬Ø¯ÙŠØ¯.",
  "Issue 12":
    "Ø¯ÙØ¹Ø© ØªÙ‚ÙˆÙŠØ© Ø§Ù„Ø¬Ø³Ø± Ø§Ù„ØªØ¬Ø§Ø±ÙŠ: proof Ø£ÙˆØ¶Ø­ Ù‚Ø¨Ù„ ØªØ±Ù‚ÙŠØ© routine Ø¬ÙŠØ¯ Ø¨Ù…Ø§ ÙŠÙƒÙÙŠØŒ Ø§Ù†ØªÙ‚Ø§Ù„ Ø£ÙƒØ«Ø± Ø¯Ù‚Ø© Ù…Ù† concern Ø§Ù„ØªØµØ¨ØºØ§Øª Ø¥Ù„Ù‰ product confidenceØŒ Ø¬Ø³ÙˆØ± ØªØ­Ø±ÙŠØ±ÙŠØ© ØªÙ‚Ù„Ù„ hesitation Ù‚Ø¨Ù„ beauty-setsØŒ ÙˆÙ…Ù†Ø·Ù‚ ØªÙˆØ³Ø¹ haircare Ù…Ø¨Ù†ÙŠ Ø¹Ù„Ù‰ repeat use Ù„Ø§ Ø¹Ù„Ù‰ Ø§Ù„Ø­Ù…Ø§Ø³ ÙˆØ­Ø¯Ù‡.",
  "Issue 13":
    "Ø¯ÙØ¹Ø© Ù…Ø§ Ø¨Ø¹Ø¯ Ø§Ù„ØªØ­ÙˆÙŠÙ„: proof Ø£ÙˆØ¶Ø­ Ø¨Ø¹Ø¯ Ø£ÙˆÙ„ Ø¥Ø¹Ø§Ø¯Ø© Ø´Ø±Ø§Ø¡ØŒ ÙØµÙ„ replenishment Ø§Ù„ÙØ±Ø¯ÙŠ Ø¹Ù† Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ bundleØŒ ØªØ¶ÙŠÙŠÙ‚ searches Ø§Ù„ØªÙŠ ØªØ¨Ø¯Ùˆ ingredient-led Ù„ÙƒÙ†Ù‡Ø§ ÙÙŠ Ø§Ù„Ø­Ù‚ÙŠÙ‚Ø© Ø£Ø³Ø¦Ù„Ø© comfort ÙˆlayeringØŒ ÙˆØ¨Ù†Ø§Ø¡ bridge Ø£ÙˆØ¶Ø­ Ù…Ù† Ø¥Ø¬Ø§Ø¨Ø© Journal Ø¥Ù„Ù‰ routine choice Ù‚Ø¨Ù„ checkout.",
  "Issue 14":
    "Ø¯ÙØ¹Ø© ØªØ¶ÙŠÙŠÙ‚ Ø§Ù„Ø§Ø¹ØªØ±Ø§Ø¶Ø§Øª ÙˆØ¥Ø´Ø§Ø±Ø§Øª Ø§Ù„Ù‚Ø±Ø§Ø±: Ø§Ø¹ØªØ±Ø§Ø¶Ø§Øª Ø£ÙˆØ¶Ø­ Ø¨Ø¹Ø¯ Ø§Ù„Ø¯ÙˆØ±Ø© Ø§Ù„Ø«Ø§Ù†ÙŠØ© Ù‚Ø±Ø¨ Ø§Ù„Ù€PDPØŒ restock cues ØªÙ…Ù†Ø¹ ÙƒØ³Ø± Ø§Ù„Ø±ÙˆØªÙŠÙ† Ù‚Ø¨Ù„ Ø§Ù„Ù†ÙØ§Ø¯ Ø§Ù„ÙƒØ§Ù…Ù„ØŒ ØªØµØ­ÙŠØ­ myth Ø¹Ø§Ù„ÙŠ Ø§Ù„Ù†ÙŠØ© Ø­ÙˆÙ„ longwearØŒ ÙˆØ¬Ø³Ø± Ø£Ø¯Ù‚ Ù…Ù† ÙÙ‡Ù… niacinamide Ø¥Ù„Ù‰ category Ø£Ùˆ product decision.",
  "Issue 15":
    "Ø¯ÙØ¹Ø© Ø¶Ø¨Ø· Ø§Ù„Ù…Ù‚Ø§Ø±Ù†Ø© Ù‚Ø¨Ù„ Ø§Ù„ØªÙˆØ³Ù‘Ø¹: Ù…Ù†Ø·Ù‚ Ø£ÙˆØ¶Ø­ Ù„Ù…Ù‚Ø§Ø±Ù†Ø© Ø§Ù„Ø¯ÙˆØ±Ø© Ø§Ù„Ø«Ø§Ù†ÙŠØ© Ù‚Ø±Ø¨ Ø§Ù„Ù€PDPØŒ Ø­ÙƒÙ… Ø£Ø¯Ù‚ Ø¨ÙŠÙ† Ø§Ù„Ù†ÙØ§Ø¯ ÙˆØ§Ù„ØªØ±Ù‚ÙŠØ© Ù‚Ø¨Ù„ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø·Ù„Ø¨ØŒ ØªØ¶ÙŠÙŠÙ‚ intent Ø¨ÙŠÙ† ingredient Ùˆconcern ÙÙŠ Ø§Ù„Ø¨Ø­Ø« Ø§Ù„Ø¹Ø§Ù„ÙŠ Ø§Ù„Ù†ÙŠØ©ØŒ ÙˆØ¬Ø³Ø± Ø£Ù‚Ø±Ø¨ Ù…Ù† Ø¥Ø¬Ø§Ø¨Ø© Ø§Ù„Ù…Ù‚Ø§Ù„Ø© Ø¥Ù„Ù‰ collection Ø£Ùˆ PDP Ø¬Ø§Ù‡Ø² Ù„Ù„Ø´Ø±Ø§Ø¡.",
  "Issue 16":
    "Ø¯ÙØ¹Ø© ØªØ¶ÙŠÙŠÙ‚ Ø§Ù„Ø­ÙƒÙ… Ù‚Ø¨Ù„ Ø§Ù„Ø¯ÙØ¹: ÙØµÙ„ Ø£ÙˆØ¶Ø­ Ø¨ÙŠÙ† Ø§Ù„Ù…Ù†ØªØ¬ ÙˆØ§Ù„Ø±ÙˆØªÙŠÙ† Ø¹Ù†Ø¯Ù…Ø§ ÙŠÙƒÙˆÙ† second-cycle proof Ù…Ø®ØªÙ„Ø·Ù‹Ø§ØŒ Ø­ÙˆØ§Ø¬Ø² Ø£Ø¯Ù‚ Ù„Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø·Ù„Ø¨ Ø¹Ù†Ø¯Ù…Ø§ ØªÙƒÙˆÙ† depletion cues ØºÙŠØ± Ø«Ø§Ø¨ØªØ©ØŒ clarifiers Ø£Ø¶ÙŠÙ‚ Ù„Ø£Ø³Ø¦Ù„Ø© layering Ùˆtiming Ù‚Ø¨Ù„ Ø²ÙŠØ§Ø±Ø© Ø§Ù„ÙØ¦Ø©ØŒ Ùˆhandoff Ø£Ù‚Ø±Ø¨ Ù…Ù† Ø§Ù„Ù…Ù‚Ø§Ù„Ø© Ø¥Ù„Ù‰ PDP Ø¨Ø¹Ø¯ Ø­Ø³Ù… collection.",
  "Issue 17":
    "Ø¯ÙØ¹Ø© ØªØ«Ø¨ÙŠØª Ø§Ù„Ø­ÙƒÙ… Ù‚Ø¨Ù„ Ø§Ù„ØªØ¨Ø¯ÙŠÙ„: Ø§Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù†ØªØ¬ Ø£Ùˆ reset Ø§Ù„Ø±ÙˆØªÙŠÙ†ØŒ ØªÙˆÙ‚ÙŠØª reorder Ù…Ø¹ ØªØºÙŠÙ‘Ø± cadenceØŒ clarifier Ø£Ø¯Ù‚ Ù„Ø£Ø³Ø¦Ù„Ø© haircare Ø¨ÙŠÙ† Ø§Ù„Ø·Ù‚Ø³ ÙˆØ§Ù„Ù€fitØŒ ÙˆØ­Ø³Ù… Ø§Ø¹ØªØ±Ø§Ø¶Ø§Øª Ø§Ù„Ù€PDP Ø­ÙˆÙ„ finish Ùˆtexture Ùˆusage.",
  "Issue 18":
    "دفعة تضييق القرار قبل الشراء المتكرر: فصل mixed-proof بين أثر الموسم وانحراف الروتين، حسم restock المفرد مقابل العودة إلى set، توضيح finish مقابل coverage قبل PDP، وبناء جسر أوضح بين weather effect وproduct fit في haircare.",
  "Issue 19":
    "دفعة تدقيق التحول قبل الدفع: تمييز fluctuation القصير عن decline الحقيقي، حسم single-restock مقابل set-return، توضيح base-finish مقابل longwear قبل PDP، وتعميق جسر humidity-versus-fit قبل handoff في haircare.",
  "Issue 20":
    "دفعة تحويل القرار إلى فعل قبل الدفع: حسم reorder مقابل upgrade عند ثبات النتيجة مع هبوط الثقة، ترتيب proof لاعتراض long-day longwear قبل PDP، فصل routine drift عن product mismatch في haircare، وتحديد متى تنتقل من Journal إلى category أو مباشرة إلى PDP.",
  "Issue 21":
    "دفعة ضغط القرار قبل الدفع: قواعد post-upgrade validation قبل full reorder، تشخيص longwear breakdown بين sweat وsebum وapplication drift، حسم keep-tuning مقابل mismatch بعد weather-adjustment في haircare، وتحديد متى يكون Journal-to-PDP direct أفضل من category revisit.",
  "Issue 22":
    "دفعة تثبيت القرار قبل الدفع: عتبات reorder confidence بعد دورة أو دورتين، ترياج longwear بين finish mismatch وحدود durability، فحص friction بعد استقرار الطقس في haircare، وربط Journal بخطوة pre-checkout أدق للمستخدم product-leaning.",
  "Issue 23":
    "دفعة إغلاق التردد الأخير قبل الشراء: keep-versus-introduce عند micro-gap واحد، مسارات longwear reassurance بين touch-up وfull restart، حسم simplification مقابل replacement في haircare بعد أسبوع مستقر، وربط Journal بمسار PDP-to-cart مع اعتراض واحد متبقٍ.",
  "Issue 24":
    "دفعة حسم ما قبل الدفع: إغلاق الاعتراض الأخير بعد المقال قبل cart continuation، ضغط التحقق داخل PDP بين proof snippet وfull comparison، تثبيت maintenance thresholds في haircare بعد نجاح simplification، وإضافة reorder confirmation prompt بعد حل أول اعتراض high-intent.",
  "Issue 25":
    "دفعة تقليل التردد قبل الدفع: cart-readiness بعد PDP verification، ضغط concern-to-PDP objection بعد category fallback، قواعد تأكيد replacement في haircare بعد maintenance-window drift، وحواجز repeat-order مع ثقة مرتفعة وتوقيت نفاد غير ثابت.",
  "Issue 26":
    "دفعة إحكام القرار قبل الدفع: ضغط اعتراض checkout قبل تبديل طريقة الدفع، handoff proof أوضح من PDP إلى cart عند تردد شحن/ثقة واحد، فصل rebound الرطوبة في haircare بين maintenance وreplacement، وضبط repeat-order بعد travel-week usage drift.",
  "Issue 27":
    "دفعة تثبيت قرار الدفع النهائي: فحص coupon distraction قرب التأكيد، handoff ثقة لنافذة التوصيل من PDP إلى cart، قواعد keep-versus-replace بعد دورتين rebound في haircare، وguardrails توقيت repeat-order أثناء استعادة الإيقاع بعد السفر.",
  "Issue 28":
    "دفعة استعادة الثبات قرب الإتمام: recovery بعد coupon rejection في checkout، handoff ثقة من سياق PDP إلى تنفيذ cart قبل الدفع، فحص ثبات keep في haircare خلال نافذة الرطوبة التالية، وضبط refill urgency عندما يعود الإيقاع بعد السفر بشكل شبه مستقر.",
  "Issue 29":
    "دفعة إحكام قرار التأكيد النهائي: ضبط checkout confirmation بعد payment-option toggling، handoff ثقة أوضح لالتزام التوصيل من PDP إلى cart، التقاط second-window drift في haircare بعد أول استقرار، وضبط repeat-order volume عندما تكون refill urgency أعلى من وضوح الاستهلاك.",
};

type JournalArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return journalArticles.map((article) => ({ slug: article.slug }));
}
export async function generateMetadata({
  params,
}: JournalArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = journalArticles.find((entry) => entry.slug === slug);

  if (!article) {
    return {};
  }

  const title = article.title;
  const description = article.excerpt;
  const pageUrl = absoluteUrl(`/journal/${article.slug}`);
  const imageUrl = absoluteUrl("/og-journal.svg");

  return {
    title,
    description,
    alternates: {
      canonical: `/journal/${article.slug}`,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function JournalArticlePage({
  params,
}: JournalArticlePageProps) {
  const { slug } = await params;
  const article = journalArticles.find((entry) => entry.slug === slug);

  if (!article) {
    notFound();
  }

  const articleIssue = article.issue ?? "Issue 01";
  const issueSummary = issueDirectory[articleIssue] ?? issueDirectory["Issue 01"];
  const collectionEntry = collectionDirectory[article.collection];
  const relatedConcernHref = article.relatedConcern;
  const relatedProductHref = article.relatedProduct;
  const relatedConcern = getConcernByHref(relatedConcernHref);
  const relatedRoutine = getRoutineByHref(article.relatedRoutine);
  const relatedProduct = getProductByHref(relatedProductHref);
  const relatedIngredient = article.relatedIngredient
    ? getIngredientByHref(article.relatedIngredient)
    : relatedProduct
      ? getIngredientByName(relatedProduct.ingredient)
      : undefined;
  const relatedArticles = journalArticles
    .filter((entry) => entry.slug !== article.slug)
    .sort((left, right) => {
      const leftScore =
        Number((left.issue ?? "Issue 01") === articleIssue) * 3 +
        Number(left.pillar === article.pillar) * 2 +
        Number(left.collection === article.collection);
      const rightScore =
        Number((right.issue ?? "Issue 01") === articleIssue) * 3 +
        Number(right.pillar === article.pillar) * 2 +
        Number(right.collection === article.collection);

      return rightScore - leftScore;
    })
    .slice(0, 3);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.excerpt,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        inLanguage: "ar-SA",
        url: absoluteUrl(`/journal/${article.slug}`),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "الرئيسية",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "المجلة",
            item: absoluteUrl("/journal"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: absoluteUrl(`/journal/${article.slug}`),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: article.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <StorefrontShell activeHref="/journal">
        <div className={styles.page}>
          <CinematicDetailStage
            eyebrow={`${articleIssue} / ${article.category}`}
            title={article.title}
            summary={article.deck}
            purchaseHref={relatedProductHref ?? collectionEntry.href}
            collectionHref={collectionEntry.href}
            collectionLabel={collectionEntry.title}
            analyticsKey={article.slug}
          />
          <section className={styles.articleShell}>
            <article className={styles.articleLayout}>
              <div className={styles.articleHeader}>
                <div className={styles.articleIntro}>
                  <p className={styles.eyebrow}>
                    {articleIssue} / {article.category} / {article.pillar}
                  </p>
                  <h1 className={styles.articleTitle}>{article.title}</h1>
                  <p className={styles.articleDeck}>{article.deck}</p>
                  <div className={styles.meta}>
                    <span>{article.readingTime}</span>
                    <span>آخر تحديث: {article.updatedAt}</span>
                  </div>
                </div>
                <section className={styles.takeawayCard}>
                  <p className={styles.eyebrow}>Takeaways</p>
                  <h2>ثلاث نقاط قبل الانتقال إلى صفحة الشراء</h2>
                  <ul className={styles.bulletList}>
                    {article.takeaways.map((takeaway) => (
                      <li key={takeaway}>{takeaway}</li>
                    ))}
                  </ul>
                </section>
              </div>
              <div className={styles.articleBody}>
                <section className={styles.articleSection}>
                  <h2>الإجابة السريعة</h2>
                  <p>{article.answer}</p>
                </section>

                {article.sections.map((section) => (
                  <section key={section.heading} className={styles.articleSection}>
                    <h2 id={section.heading}>{section.heading}</h2>
                    <p>{section.body}</p>
                  </section>
                ))}
              </div>
            </article>

            <aside className={styles.sidebar}>
              <div className={styles.sidebarCard}>
                <p className={styles.eyebrow}>Issue context</p>
                <h2>{articleIssue}</h2>
                <p>{issueSummary.includes("Ø") ? article.deck : issueSummary}</p>
                <TrackedLink
                  href="/journal#issue-directory"
                  analyticsLabel={`article_issue_directory_${article.slug}`}
                  analyticsSurface="article_sidebar"
                  analyticsDestinationType="journal_index"
                >
                  العودة إلى خريطة الدفعات
                </TrackedLink>
              </div>

              <div className={styles.sidebarCard}>
                <p className={styles.eyebrow}>المحتوى</p>
                <h2>خريطة المقال</h2>
                <div className={styles.toc}>
                  {article.sections.map((section) => (
                    <a key={section.heading} href={`#${section.heading}`}>
                      {section.heading}
                    </a>
                  ))}
                </div>
              </div>

              <div className={styles.sidebarCard}>
                <p className={styles.eyebrow}>روابط ذات صلة</p>
                <h2>المسار التجاري</h2>
                <div className={styles.toc}>
                  {relatedConcern && relatedConcernHref ? (
                    <TrackedLink
                      href={relatedConcernHref}
                      analyticsLabel={`article_related_concern_${article.slug}`}
                      analyticsSurface="article_sidebar"
                      analyticsDestinationType="concern"
                    >
                      {relatedConcern.title}
                    </TrackedLink>
                  ) : null}
                  {relatedRoutine ? (
                    <TrackedLink
                      href={article.relatedRoutine}
                      analyticsLabel={`article_related_routine_${article.slug}`}
                      analyticsSurface="article_sidebar"
                      analyticsDestinationType="routine"
                    >
                      {relatedRoutine.title}
                    </TrackedLink>
                  ) : null}
                  {relatedProduct && relatedProductHref ? (
                    <TrackedLink
                      href={relatedProductHref}
                      analyticsLabel={`article_related_product_${article.slug}`}
                      analyticsSurface="article_sidebar"
                      analyticsDestinationType="product"
                    >
                      {relatedProduct.name}
                    </TrackedLink>
                  ) : null}
                  {relatedIngredient ? (
                    <TrackedLink
                      href={`/ingredients/${relatedIngredient.slug}`}
                      analyticsLabel={`article_related_ingredient_${article.slug}_${relatedIngredient.slug}`}
                      analyticsSurface="article_sidebar"
                      analyticsDestinationType="ingredient"
                    >
                      {relatedIngredient.title}
                    </TrackedLink>
                  ) : null}
                  <TrackedLink
                    href={collectionEntry.href}
                    analyticsLabel={`article_to_collection_${article.slug}`}
                    analyticsSurface="article_sidebar"
                    analyticsDestinationType="collection"
                  >
                    {`الانتقال إلى فئة ${collectionEntry.title}`}
                  </TrackedLink>
                  <TrackedLink
                    href="/trust"
                    analyticsLabel={`article_to_trust_${article.slug}`}
                    analyticsSurface="article_sidebar"
                    analyticsDestinationType="trust"
                  >
                    استعراض مركز الثقة
                  </TrackedLink>
                  <TrackedLink
                    href="/journal"
                    analyticsLabel={`article_back_to_journal_${article.slug}`}
                    analyticsSurface="article_sidebar"
                    analyticsDestinationType="journal_index"
                  >
                    العودة إلى المجلة
                  </TrackedLink>
                </div>
              </div>
            </aside>
          </section>

          <section className={styles.nextStepCard}>
            <p className={styles.eyebrow}>Next Step</p>
            <h2>خطوتك التالية بعد هذه القراءة</h2>
            <p>
              إذا أصبحت الصورة أوضح الآن، فالخطوة المنطقية التالية هي الانتقال
              مباشرة إلى المسار الذي يكمل هذا القرار داخل المتجر.
            </p>
            <div className={styles.actionRow}>
              <TrackedLink
                href={article.nextStep.href}
                analyticsLabel={`article_next_step_${article.slug}`}
                analyticsSurface="article_next_step"
                analyticsDestinationType={article.nextStep.destinationType}
              >
                {article.nextStep.label}
              </TrackedLink>
              <TrackedLink
                className={styles.secondaryLink}
                href="/journal"
                analyticsLabel={`article_back_to_journal_primary_${article.slug}`}
                analyticsSurface="article_next_step"
                analyticsDestinationType="journal_index"
              >
                العودة إلى فهرس المجلة
              </TrackedLink>
            </div>
          </section>

          <section className={styles.relatedReadsSection}>
            <p className={styles.eyebrow}>Read Next</p>
            <h2>مقالات تكمل نفس القرار</h2>
            <div className={styles.relatedReadsGrid}>
              {relatedArticles.map((relatedArticle) => (
                <article
                  key={relatedArticle.slug}
                  className={styles.relatedReadCard}
                >
                  <span className={styles.pillLabel}>
                    {relatedArticle.category}
                  </span>
                  <h3>{relatedArticle.title}</h3>
                  <p>{relatedArticle.excerpt}</p>
                  <TrackedLink
                    href={`/journal/${relatedArticle.slug}`}
                    analyticsLabel={`article_related_read_${article.slug}_${relatedArticle.slug}`}
                    analyticsSurface="article_related_reads"
                    analyticsDestinationType="article"
                  >
                    قراءة المقال
                  </TrackedLink>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.faqCard}>
            <p className={styles.eyebrow}>FAQ</p>
            <h2>أسئلة مرتبطة بنفس نية البحث</h2>
            <div className={styles.faqList}>
              {article.faq.map((item) => (
                <article key={item.question} className={styles.faqItem}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </StorefrontShell>
    </>
  );
}
