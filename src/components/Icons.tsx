// Icônes SVG monochromes : remplacent les emojis couleur pour coller à l'UI
// SteamOS (même passe que Steamcord v1.16.1 / BoneCast). Bootstrap Icons via
// react-icons (déjà en dép, tree-shaké) : 1em / currentColor → hérite taille et couleur.
import {
  BsArrowRepeat, BsCloudDownload, BsController, BsExclamationTriangleFill,
  BsGearFill, BsGithub, BsLightningCharge, BsThermometerHalf,
} from "react-icons/bs";

type IcProps = { size?: number | string; color?: string; style?: any };

const mk = (C: any) => (p: IcProps = {}) => (
  <C size={p.size} color={p.color}
     style={{ verticalAlign: "-0.125em", flexShrink: 0, ...(p.style || {}) }} />
);

export const IcController = mk(BsController);
export const IcDownload = mk(BsCloudDownload);
export const IcGear = mk(BsGearFill);
export const IcGithub = mk(BsGithub);
export const IcLightning = mk(BsLightningCharge);
export const IcRefresh = mk(BsArrowRepeat);
export const IcThermometer = mk(BsThermometerHalf);
export const IcWarn = mk(BsExclamationTriangleFill);
