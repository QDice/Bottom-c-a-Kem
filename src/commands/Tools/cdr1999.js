import { SlashCommandBuilder, MessageFlags } from "discord.js";

import { successEmbed } from "../../utils/embeds.js";
import { logger } from "../../utils/logger.js";
import { InteractionHelper } from "../../utils/interactionHelper.js";

import {
  createControlButtons,
  formatTime,
  startCountdown,
} from "../../handlers/countdownButtons.js";

import { activeCountdowns } from "./countdown.js";

async function runCdr1999(interaction) {
  const deferSuccess =
    await InteractionHelper.safeDefer(interaction);

  if (!deferSuccess) {
    logger.warn("CDR1999 defer failed", {
      userId: interaction.user?.id,
      guildId: interaction.guildId,
    });

    return;
  }

  const m = interaction.options.getInteger("m");

  if (!Number.isInteger(m) || m < 0 || m > 240) {
    await InteractionHelper.safeEditReply(interaction, {
      content: "❌ Số nhập vào phải nằm trong khoảng từ `0` đến `240`.",
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  const totalMinutes = (240 - m) * 6;

  if (totalMinutes <= 0) {
    await InteractionHelper.safeEditReply(interaction, {
      content: `✅ \`(240 - ${m}) × 6 = 0 phút\`. Không cần tạo countdown.`,
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  const totalSeconds = totalMinutes * 60;
  const endTime = Date.now() + totalSeconds * 1000;

  const channelId =
    interaction.channelId ??
    interaction.channel?.id ??
    "unknown";

  const countdownId =
    `cdr1999-${channelId}-${Date.now()}`;

  const title = `CDR1999 — ${m}`;
  const row = createControlButtons(countdownId);

  const initialEmbed = successEmbed(
    `⏱️ ${title}`,
    [
      `Công thức: \`(240 - ${m}) × 6\``,
      `Tổng thời gian: **${totalMinutes} phút**`,
      `Còn lại: **${formatTime(totalSeconds)}**`,
    ].join("\n")
  );

  const message = await interaction.channel.send({
    embeds: [initialEmbed],
    components: [row],
  });

  const countdownData = {
    message,
    endTime,
    remainingTime: totalSeconds * 1000,
    isPaused: false,
    title,
    lastUpdate: Date.now(),
    interval: null,
  };

  activeCountdowns.set(countdownId, countdownData);

  startCountdown(
    countdownId,
    countdownData,
    activeCountdowns
  );

  await InteractionHelper.safeEditReply(interaction, {
    content:
      `✅ Đã bắt đầu countdown **${totalMinutes} phút**.`,
    flags: MessageFlags.Ephemeral,
  });
}

export default {
  data: new SlashCommandBuilder()
    .setName("cdr1999")
    .setDescription("Countdown theo công thức (240 - m) × 6 phút")
    .addIntegerOption((option) =>
      option
        .setName("m")
        .setDescription("Nhập số từ 0 đến 240")
        .setMinValue(0)
        .setMaxValue(240)
        .setRequired(true)
    ),

  async execute(interaction) {
    await runCdr1999(interaction);
  },
};
