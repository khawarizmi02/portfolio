import type { Condition } from "./useKLWeather";

const ICONS: Record<Condition, [day: string, night: string]> = {
  clear: ["ph-sun", "ph-moon-stars"],
  cloudy: ["ph-cloud-sun", "ph-cloud-moon"],
  rain: ["ph-cloud-rain", "ph-cloud-rain"],
  storm: ["ph-cloud-lightning", "ph-cloud-lightning"],
  haze: ["ph-cloud-fog", "ph-cloud-fog"],
};

export const iconFor = (c: Condition, isDay: boolean) => ICONS[c][isDay ? 0 : 1];

export const HEADLINES: Record<Condition, { day: string; night: string; kicker: string }> = {
  clear: { day: "Sun's blazing over KL.", night: "Clear skies over KL tonight.", kicker: "Good day to ship." },
  cloudy: { day: "Overcast in KL.", night: "Cloudy night in KL.", kicker: "Deploys still clear." },
  rain: { day: "Raining in KL.", night: "Rain over KL tonight.", kicker: "Perfect weather to ship." },
  storm: { day: "Thunderstorm over KL.", night: "Storm over KL tonight.", kicker: "Servers still up." },
  haze: { day: "Jerebu over KL.", night: "Hazy night in KL.", kicker: "The code isn't hazy." },
};
