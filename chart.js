function makeChart() {
	const opts = {
		title: "Increasing length data",
		width: 800,
		height: 600,
		cursor: {
			drag: {
				setScale: false,
			}
		},
		select: {
			show: false,
		},
		series: [
			{},
			{
				label: "Display A",
				scale: "",
				// value: (u, v) => v == null ? null : v.toFixed(1) + "%",
				stroke: "red",
			},
			{
				label: "Display B",
				scale: "",
				// value: (u, v) => v == null ? null : v.toFixed(2) + " MB",
				stroke: "green",
			}
		],
		axes: [
			{},
			{
				// scale: '%',
				// values: (u, vals, space) => vals.map(v => +v.toFixed(1) + "%"),
			},
			{
				side: 1,
				// scale: 'mb',
				// values: (u, vals, space) => vals.map(v => +v.toFixed(2) + " MB"),
				grid: {show: false},
			},
		],
	};

	let data = [[],[],[]];
	let chart = new uPlot(opts, data, document.getElementById('chartCanvas'));
	chart.setData(data)
	return chart
}

let chart = makeChart()

