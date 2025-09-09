interface WarningIconProps {
	size?: number;
	showBackground?: boolean;
	className?: string;
}

export default function WarningIcon({
	size = 24,
	showBackground = false,
	className = "text-abi-blue-1 dark:text-abi-dark-blue-1",
}: WarningIconProps) {
	if (showBackground) {
		// Error boundary version - with circular background, scaled properly
		const outerSize = Math.max(32, size * 1.2); // Outer circle is 20% larger than icon
		const innerSize = Math.max(24, size * 0.9); // Inner circle is 90% of icon size
		const iconSize = Math.max(16, size * 0.6); // Icon is 60% of total size

		return (
			<div className="relative p-2">
				{/* Outer circle */}
				<div
					style={{ width: `${outerSize}px`, height: `${outerSize}px` }}
					x={[
						"rounded-full",
						"bg-abi-lgrey dark:bg-abi-dark-lgrey",
						"flex items-center justify-center",
						"shadow-[0_0_4px_4px_white] dark:shadow-[0_0_4px_4px_rgb(17_24_39)]",
					]}
				>
					{/* Inner circle */}
					<div
						style={{ width: `${innerSize}px`, height: `${innerSize}px` }}
						x={["rounded-full", "bg-white dark:bg-gray-900", "flex items-center justify-center"]}
					>
						{/* Warning icon */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={iconSize}
							height={iconSize}
							fill="currentColor"
							viewBox="0 0 256 256"
							x={className}
						>
							<path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"></path>
						</svg>
					</div>
				</div>
			</div>
		);
	}

	// Simple version - no background
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			fill="currentColor"
			viewBox="0 0 256 256"
			x={className}
		>
			<path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"></path>
		</svg>
	);
}
