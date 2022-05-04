import React, { FunctionComponent } from 'react';
import { MOBILE_WIDTH, ORDER_TYPE_ASKS, ORDER_TYPE_BIDS } from "../../constants";

const DepthVisualizerColors = {
    BIDS: "#113534",
    ASKS: "#3d1e28"
};

const DepthVisualizer = ({windowWidth, depth, orderType }) => {
    return <div data-testid="depth-visualizer" style={{
                backgroundColor: `${orderType === ORDER_TYPE_BIDS ? DepthVisualizerColors.BIDS : DepthVisualizerColors.ASKS}`,
                height: "1.250em",
                width: `${depth}%`,
                position: "relative",
                top: 21,
                left: `${orderType === ORDER_TYPE_BIDS && windowWidth > MOBILE_WIDTH ? `${100 - depth}%` : 0}`,
                marginTop: -24,
                zIndex: 1,
            }} />;
};

export default DepthVisualizer;