import { createComponent } from "@lit/react";
import * as React from "react";
import { TcLogoCluster } from "../logo-cluster";

export type { ClusterLogo } from "../logo-cluster";

/** A brand mark with logos around it; `label` makes it an image, otherwise it is decorative. The ref receives the element */
export const LogoCluster = createComponent({ tagName: "tc-logo-cluster", elementClass: TcLogoCluster, react: React });
export type LogoClusterProps = React.ComponentProps<typeof LogoCluster>;
