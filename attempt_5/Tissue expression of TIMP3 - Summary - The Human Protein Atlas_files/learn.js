/* global $, Plotly, d3 */

// eslint-disable-next-line no-use-before-define
var cluster_data = cluster_data || {};

// eslint-disable-next-line no-unused-vars
function createCytoscape(id, data, tissuename, otherNodeSize, width) {
	var color = {
		1: '#ff9d13',
		2: '#cdccca',
		3: '#e41c20',
		4: '#000000',
		5: '#50c8eb',
		6: '#fb0096'
	};
	var textcolor = {
		1: '#000',
		2: '#000',
		3: '#000',
		4: '#fff',
		5: '#000',
		6: '#000'
	};
	if (typeof otherNodeSize === 'undefined') {
		otherNodeSize = 30;
	}

	if (typeof width === 'undefined') {
		width = 650;
	}
	var height = 650;

	var svg = d3.select('#cytoscapeplot' + id)
		.attr('tabindex', 1)
		.append('svg')
		.attr('width', width)
		.attr('height', height);

	var link = svg
		.append('g')
		.attr('class', 'link')
		.selectAll('line');

	var node = svg
		.append('g')
		.attr('class', 'nodecontainer')
		.selectAll('.node');

	var node_converter = [];
	var filtered_nodes = [];
	data.nodes.forEach(function(d) {
		if (d.name != '0') {
			node_converter[d.id] = d;
			filtered_nodes.push(d);
		}
	});
	data.nodes = filtered_nodes;

	var filtered_links = [];
	data.links.forEach(function(d) {
		if (node_converter[d.source] && node_converter[d.target]) {
			d.source = node_converter[d.source];
			d.target = node_converter[d.target];
			filtered_links.push(d);
		}
	});
	data.links = filtered_links;

	var graph = {
		nodes: data.nodes,
		links: data.links
	};

	link = link
		.data(graph.links)
		.enter()
		.append('line')
		.attr('x1', function(d) { return d.source.x; })
		.attr('y1', function(d) { return d.source.y; })
		.attr('x2', function(d) { return d.target.x; })
		.attr('y2', function(d) { return d.target.y; })
		.style('stroke', '#000')
		.style('stroke-width', '1.5px');

	node = node
		.data(graph.nodes)
		.enter()
		.append('g')
		.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
		.attr('class', 'node')
		.call(d3.drag()
			.on('drag', function() {
				nudge(d3.event.dx, d3.event.dy);
			}));

	var anchor = node.append('a')
		.attr('xlink:href', function(d) {
			return d.url;
		});

	anchor.append('circle')
		.attr('class', 'circle')
		.attr('r', function(d) {
			if (isNaN(d.name)) {
				if (d.group == 4) {
					return 40;
				}
				return otherNodeSize;
			}
			if (d.name <= 1) {
				return 9;
			}
			if (d.name <= 20) {
				return 9 + Math.sqrt(d.name) * 1.5;
			}
			return Math.log(d.name) * 6;
		})
		.style('fill', function(d) { return color[d.group]; })
		.attr('title', function(d) {
			if (d.group == 5 || d.group == 6) {
				return d.group == 5 ? 'Overrepresented' : 'Underrepresented';
			}
			return '';
		});

	anchor.append('text')
		.each(function (d) {
			d.name = d.name.toString();
			if (d.name === 'endometrium') {
				d.name = 'endo- metrium';
			}
			var arr = d.name.split(' ');
			if (arr !== undefined) {
				var line_diff = 1.15;
				var dy;
				for (var i = 0; i < arr.length; i++) {
					if (i === 0) {
						dy = 0.35 - (arr.length - 1) / 2 * line_diff;
					} else {
						dy = line_diff;
					}
					d3.select(this).append('tspan')
						.text(arr[i])
						.attr('dy', dy.toPrecision(3) + 'em')
						.attr('x', '-0.5')
						.attr('text-anchor', 'middle')
						.attr('class', 'text')
						.style('fill', function(d2) { return textcolor[d2.group]; });
				}
			}
		});

	anchor.on('mouseover', function(d) {
		if (!d.mouseoverselected) {
			node.classed('mouseoverselected', function(p) {
				p.mouseoverselected = d === p;
				return p.mouseoverselected;
			});
		}
		d3.select(this).style('fill', 'transparent');
		link.filter(function(d2) {
			return d2.target.mouseoverselected;
		}).style('stroke', '#3366ff');
		link.filter(function(d2) {
			return d2.source.mouseoverselected;
		}).style('stroke', '#3366ff');
	}).on('mouseout', function(d) {
		link.filter(function(d2) {
			return d2.target.mouseoverselected;
		}).style('stroke', '#000000');
		link.filter(function(d2) {
			return d2.source.mouseoverselected;
		}).style('stroke', '#000000');
		if (d.mouseoverselected) {
			node.classed('mouseoverselected', d.mouseoverselected = false);
		}
	}).on('mousedown', function(d) {
		if (!d.selected) {
			node.classed('selected', function(p) {
				p.selected = d === p;
				return p.selected;
			});
		}
	}).on('mouseup', function(d) {
		if (d.selected) {
			d3.select(this).classed('selected', d.selected = false);
		}
	});

	if (tissuename === 'TS' || tissuename.substr(0, 3) === 'TS_') {
		anchor.attr('transform', 'scale(0.8)');
		anchor.select('circle').attr('transform', 'scale(0.85)');
	}

	function nudge(dx, dy) {
		node.filter(function(d) {
			return d.selected;
		}).attr('transform', function(d) {
			d.x = parseFloat(d.x) + dx;
			d.y = parseFloat(d.y) + dy;
			return 'translate(' + d.x + ',' + d.y + ')';
		});

		link.filter(function(d) { return d.source.selected; })
			.attr('x1', function(d) { return d.source.x; })
			.attr('y1', function(d) { return d.source.y; });

		link.filter(function(d) { return d.target.selected; })
			.attr('x2', function(d) { return d.target.x; })
			.attr('y2', function(d) { return d.target.y; });

		if (d3.event.preventDefault) {
			d3.event.preventDefault();
		} else {
			d3.event.returnValue = false;
		}
	}
}

function createFoldenrichmentPlot(data, id, settings) {
	var defaultColorScale = ['#CCCCFF', '#0000FF'];
	if (typeof settings === 'undefined') settings = {};
	if (typeof settings.colorset !== 'undefined') {
		if (settings.colorset === 'blue') {
			settings.colorscale = defaultColorScale;
		} else if (settings.colorset === 'red') {
			settings.colorscale = ['#FFCCCC', '#FF0000'];
		} else if (settings.colorset === 'Cytoplasm') {
			settings.colorscale = ['#bede8a', '#94c83d'];
		} else if (settings.colorset === 'Nucleus') {
			settings.colorscale = ['#87d3ff', '#017bc0'];
		} else if (settings.colorset === 'Endomembrane system') {
			settings.colorscale = ['#ffaf91', '#f26531'];
		}
	}
	if (typeof settings.colorscale === 'undefined') settings.colorscale = defaultColorScale;
	if (typeof settings.dimension === 'undefined') settings.width = 600;
	if (typeof settings.barheight === 'undefined') settings.barheight = 20;
	if (typeof settings.bgcolor === 'undefined') settings.bgcolor = '#FFFFFF';
	if (typeof settings.maxvalue === 'undefined') settings.maxvalue = 40;
	if (typeof settings.xAxisLabel === 'undefined') settings.xAxisLabel = '';
	if (typeof settings.padding === 'undefined') {
		settings.padding = {
			top: 30, bottom: 0, left: 200, right: 40
		};
	}
	if (typeof settings.xLabelTransform === 'undefined') settings.xLabelTransform = '';
	if (typeof settings.valueLabels === 'undefined') settings.valueLabels = false;
	if (typeof settings.grid === 'undefined') settings.grid = false;
	if (typeof settings.showRows === 'undefined') settings.showRows = false;
	var barHeight = settings.barheight;
	var chartHeight = settings.barheight * data.length;
	var height = chartHeight + settings.padding.top + settings.padding.bottom;
	var chartWidth = settings.width - settings.padding.left - settings.padding.right;
	var svg = d3.select(id)
		.attr('tabindex', 1)
		.append('svg')
		.attr('class', 'chart cluster')
		.attr('width', settings.width)
		.attr('height', height);
	if (settings.bgcolor !== '#FFFFFF') {
		svg.append('rect')
			.attr('class', 'background')
			.attr('width', settings.width)
			.attr('height', height)
			.attr('fill', settings.bgcolor);
	}
	var chart = svg
		.append('g')
		.attr('width', chartWidth)
		.attr('height', chartHeight)
		.attr('transform', 'translate(' + settings.padding.left + ',' + settings.padding.top + ')');

	// Bar color
	var color = d3.scaleLinear()
		.domain([0, settings.maxvalue])
		.range(settings.colorscale);

	// X axis
	var x = d3.scaleLinear()
		.range([0, chartWidth])
		.domain([0, d3.max(data, function(d) { return d.value; })]);
	var xAxis = d3.axisTop().scale(x).tickSizeOuter(0);
	if (settings.grid) xAxis.tickSizeInner(-chartHeight);

	// Y axis
	var y = d3.scaleBand()
		.range([0, chartHeight])
		.domain(data.map(function(d) { return d.name; }));
	var yAxis = d3.axisLeft().scale(y).tickSizeOuter(0);

	chart.append('g')
		.attr('class', 'x axis')
		.call(xAxis);

	chart.selectAll('.x.axis')
		.append('text')
		.attr('class', 'xAxisLabel')
		.attr('y', -20)
		.attr('x', chartWidth / 2)
		.style('text-anchor', 'middle')
		.style('fill', '#000')
		.text(settings.xAxisLabel);

	// The bar's
	var bar = chart.selectAll('rect')
		.data(data)
		.enter().append('g')
		.attr('class', 'bar')
		.attr('transform', function(d, i) { return 'translate(0,' + i * settings.barheight + ')'; });
	// The visual bar
	var link = bar.append('a')
		.attr('xlink:href', function(d) { return d.url; });
	link.append('rect')
		.attr('width', function(d) { return x(d.value); })
		.attr('height', settings.barheight - 1)
		.attr('fill', function(d) { return color(d.value); })
		.attr('y', 0)
		.attr('title', function(d) { return d.value_tooltip; })
		.on('mouseover', function() {
			var r = getHighlightColor($(this).css('fill'));
			$(this).attr('fill-old', $(this).css('fill'));
			d3.select(this).transition().style('fill', 'rgb(' + r[1] + ',' + r[2] + ',' + r[3] + ')');
		})
		.on('mouseout', function() {
			if ($(this).attr('fill-old')) {
				d3.select(this).transition().style('fill', $(this).attr('fill-old'));
			}
		});
	if (settings.valueLabels) {
		bar.append('text')
			.text(function(d) { return d.value; })
			.attr('text-align', 'right')
			.attr('dominant-baseline', 'middle')
			.attr('y', barHeight / 2)
			.attr('x', function(d) { return x(d.value) + 2; });
	}

	chart.append('g')
		.attr('class', 'y axis')
		.attr('width', settings.padding.left - 5)
		.call(yAxis);
	chart.selectAll('.y.axis text').attr('width', settings.padding.left - 5).text(function(d) {
		if (d.length > 31) {
			return d.substring(0, 28) + '...';
		}
		return d;
	});
	adjustClusterPlot(id);
}
function adjustClusterPlot(id) {
	var plot = $(id);
	if (plot.height() < plot.find('svg').height()) {
		$('<a href="#show" style="position:absolute; top:' + (plot.height() - 20) + 'px; right:0px; display:block;">Show full plot</a>').on('click', function() {
			$(this).hide();
			plot.css({ 'max-height': 'none' });
			return false;
		}).appendTo(plot);
	}
}

// eslint-disable-next-line no-unused-vars
function clusterAddPolygonsToLayout(shapes, clusterLayout) {
	let thisLayout = JSON.parse(JSON.stringify(clusterLayout));
	if (shapes) {
		shapes = Object.values(shapes).flat(1);
		thisLayout.shapes = [];
		for (let i in shapes) {
			if (!shapes.hasOwnProperty(i)) {
				continue;
			}
			let path = 'M';
			let first = true;
			for (let z in shapes[i]) {
				if (!shapes[i].hasOwnProperty(z)) {
					continue;
				}
				if (first) {
					first = false;
				} else {
					path += ' L';
				}
				path += `${shapes[i][z].x},${shapes[i][z].y}`;
			}
			path += ' Z';
			thisLayout.shapes.push({
				type: 'path',
				path: path,
				line: {
					color: 'rgb(0, 0, 0)',
					width: 1,
				},
			});
		}
	}
	return thisLayout;
}

function attemptPlotlyFullscreen(data) {
	const element = document.getElementById(data.id);
	if (!document.fullscreenElement) {
		element.dataset.originalWidth = element.clientWidth;
		element.dataset.originalHeight = element.clientHeight;
	}
	let p;
	if (element.requestFullscreen) {
		p = element.requestFullscreen();
	} else if (element.mozRequestFullScreen) {
		p = element.mozRequestFullScreen();
	} else if (element.webkitRequestFullscreen) {
		p = element.webkitRequestFullscreen();
	} else if (element.msRequestFullscreen) {
		p = element.msRequestFullscreen();
	} else {
		throw new Error('Cannot open fullscreen');
	}
	if (p) {
		p.then(function() {
			document.addEventListener('fullscreenchange', () => {
				if (document.fullscreenElement) {
					Plotly.relayout(element, {
						width: element.clientWidth,
						height: element.clientHeight
					});
				} else {
					Plotly.relayout(element, {
						width: element.dataset.originalWidth,
						height: element.dataset.originalHeight
					});
				}
			});
		});
	}
}

function attemptPlotlyFullscreenSubcell(data) {
	const plot = document.getElementById(data.id);
	var element = document.getElementById('fullScreenSubcell');
	if (document.fullscreenElement === element) {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) { /* Safari */
			document.webkitExitFullscreen();
		} else if (document.msExitFullscreen) { /* IE11 */
			document.msExitFullscreen();
		}
		return;
	}
	if (!document.fullscreenElement) {
		plot.parentElement.dataset.originalWidth = plot.clientWidth;
		plot.parentElement.dataset.originalHeight = plot.clientHeight;
		if ($('#filterGenes .fieldsForm').is(':visible')) {
			$('#filterGenes #fieldsLink').trigger('click');
		}
	}

	if (element.requestFullscreen) {
		element.requestFullscreen();
	} else if (element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	} else if (element.webkitRequestFullscreen) {
		element.webkitRequestFullscreen();
	} else if (element.msRequestFullscreen) {
		element.msRequestFullscreen();
	} else {
		throw new Error('Cannot open fullscreen');
	}
}

var fullscreenButton = {
	name: 'Fullscreen',
	icon: {
		'width': 1000,
		'height': 1000,
		'path': 'M 1000,250 850,100 600,350 500,250 750,0 600,-150 v 0 h 400 z M 500,450 250,700 400,850 v 0 H 0 v -400 L 150,600 400,350 z',
		'transform': 'matrix(1 0 0 1 0 150)'
	},
	direction: 'up',
	click: attemptPlotlyFullscreen
};

var fullscreenButtonSubcell = {
	name: 'Fullscreen',
	icon: {
		'width': 1000,
		'height': 1000,
		'path': 'M 1000,250 850,100 600,350 500,250 750,0 600,-150 v 0 h 400 z M 500,450 250,700 400,850 v 0 H 0 v -400 L 150,600 400,350 z',
		'transform': 'matrix(1 0 0 1 0 150)'
	},
	direction: 'up',
	click: attemptPlotlyFullscreenSubcell
};

let plotlyConfigurations = {
	genes: {
		responsive: true,
		modeBarButtonsToRemove: [
			'select2d',
			'lasso2d',
			'toggleSpikelines',
			'hoverClosestPie',
			'toggleHover',
			'hoverCompareCartesian',
			'hoverClosestCartesian',
			'resetScale2d'
		],
		displaylogo: false,
		scrollZoom: true,
		modeBarButtonsToAdd: [
			fullscreenButton,
		],
	},
	clusters: {
		displayModeBar: false,
	},
	clusteroutlines: {
		displayModeBar: false,
	},
	cell2d: {
		responsive: true,
		modeBarButtonsToRemove: [
			'select2d',
			'lasso2d',
			'toggleSpikelines',
			'hoverClosestPie',
			'toggleHover',
			'hoverCompareCartesian',
			'hoverClosestCartesian',
			'resetScale2d'
		],
		displaylogo: false,
		scrollZoom: true,
		modeBarButtonsToAdd: [
			fullscreenButtonSubcell,
		],
	},
	cell3d: {
		responsive: true,
		displaylogo: false,
		modeBarButtonsToAdd: [
			fullscreenButtonSubcell,
		],
	}
};

let clusterLayout = {
	xaxis: {
		showgrid: false,
		zeroline: false,
		ticks: '',
		showticklabels: false,
		showline: true,
		title: {
			text: 'UMAP1'
		},
	},
	yaxis: {
		showgrid: false,
		zeroline: false,
		ticks: '',
		showticklabels: false,
		showline: true,
		scaleanchor: 'x',
		scaleratio: 1,
		title: {
			text: 'UMAP2'
		},
	},
	showlegend: true,
	legend: {
		itemsizing: 'constant'
	},
	font: {
		size: 10,
		family: 'sans-serif'
	},
	title: {
		font: {
			size: 17
		},
		text: '',
	},
	hoverinfo: '',
	hovermode: 'closest',
	height: 500,
	margin: {
		l: 20,
		r: 20,
		b: 20,
		t: 20,
		pad: 4
	},
	dragmode: 'pan',
};

function clusterCreateLayout(polygons, settings) {
	let thisLayout = clusterLayout;
	if (settings.plot_type == 'genes' && polygons) {
		thisLayout = clusterAddPolygonsToLayout(polygons, clusterLayout);
	}
	if (settings.plot_type == 'clusters' || settings.plot_type == 'clusteroutlines') {
		thisLayout.xaxis.fixedrange = true;
		thisLayout.yaxis.fixedrange = true;
		thisLayout.height = settings.height? settings.height : 450;
		if (settings.width) thisLayout.width = settings.width;
	}
	if (settings.title) {
		thisLayout.title.text = settings.title;
		thisLayout.margin.t = 50;
	}
	if (settings.plot_type == 'clusteroutlines') {
		thisLayout.xaxis.visible = false;
		thisLayout.yaxis.visible = false;
	}
	if (typeof settings.showlegend !== 'undefined') {
		thisLayout.showlegend = settings.showlegend;
	}
	if (typeof settings.showaxis !== 'undefined') {
		thisLayout.xaxis.visible = settings.showaxis;
		thisLayout.yaxis.visible = settings.showaxis;
		//thisLayout.margin.t = 5;
		thisLayout.margin.b = 5;
		thisLayout.margin.r = 5;
		thisLayout.margin.l = 5;
	}
	return thisLayout;
}

// eslint-disable-next-line no-unused-vars
function plotUMAP(elem, data_in, settings) {
	let data = data_in.scatter.data;
	let annotations = data_in.annotations;
	let d;
	if (settings.plot_type == 'genes') {
		d = data.points;
	} else if (settings.plot_type == 'clusters' || settings.plot_type == 'clusteroutlines') {
		d = data;
	}
	var config = plotlyConfigurations[settings.plot_type];
	var thisLayout = clusterCreateLayout(data.polygons, settings);
	if (annotations.length) {
		thisLayout.annotations = annotations;
	}
	var plot = Plotly.newPlot(elem, d, thisLayout, config);
	if (settings.plot_type == 'clusters') {
		document.getElementById(elem).on('plotly_click', function(eventData) {
			var clusterNumber = eventData.points[0].data.cluster_no;
			window.location = settings.clickURL + '#cluster' + clusterNumber;
			return false;
		});
	}
	return plot;
}

function getClusterPlotSingleColor(plotID) {
	var elem = document.getElementById(plotID);
	if (elem) {
		return elem.getAttribute('data-singlecolor');
	}
	return undefined;
}

// eslint-disable-next-line no-unused-vars
function highlightClusterRow(tableID, clusterNumber) {
	var elem = $('#' + tableID);
	elem.find('tr.selected').removeClass('selected');
	elem.find('tr[data-clusterno="' + clusterNumber + '"]').addClass('selected');
}

// eslint-disable-next-line no-unused-vars
function updateUMAPPlot(plotID, clusterNumber, title, filters, colorType) {
	var plot_data = JSON.parse(JSON.stringify(cluster_data[plotID].scatter.data));
	var points = [];
	var polygons = {};
	if (filters && typeof filters.genes !== "undefined") {
		var selectedPoints = {
			x: [],
			y: [],
			marker: {
				color: [],
			},
			text: [],
			customdata: [],
		};
		var otherPoints = {
			x: [],
			y: [],
			text: [],
			marker: {
				color: '#444444',
			},
			customdata: [],
		};
		// Pull the genes from the different subplots and divide the selected genes and the other genes into
		// two different subplots putting the selected genes last so they are rendered last
		var clusterKeys = Object.keys(plot_data.points);
		for (var key in clusterKeys) {
			var clusterPoints = plot_data.points[key];
			for (var i = 0; i < clusterPoints.x.length; i++) {
				if (filters.genes.indexOf(clusterPoints.ensg[i]) !== -1) {
					selectedPoints.x.push(clusterPoints.x[i]);
					selectedPoints.y.push(clusterPoints.y[i]);
					selectedPoints.marker.color.push(clusterPoints.marker.color[0]);
					selectedPoints.text.push(clusterPoints.text[i]);
					selectedPoints.customdata.push(clusterPoints.customdata);
				} else {
					otherPoints.x.push(clusterPoints.x[i]);
					otherPoints.y.push(clusterPoints.y[i]);
					otherPoints.text.push(clusterPoints.text[i]);
					otherPoints.customdata.push(clusterPoints.customdata);
				}
			}
		}
		if (colorType === 'single') {
			selectedPoints.marker.color = getClusterPlotSingleColor(plotID);
		}
		otherPoints.mode = selectedPoints.mode = plot_data.points[0].mode;
		otherPoints.type = selectedPoints.type = plot_data.points[0].type;
		otherPoints.marker.size = selectedPoints.marker.size = plot_data.points[0].marker.size;
		selectedPoints.hovertemplate = plot_data.points[0].hovertemplate.replace(/data.customdata/g, 'customdata');
		otherPoints.hoverinfo = 'skip';
		otherPoints.hovertemplate = '';
		points.push(otherPoints);
		points.push(selectedPoints);
	} else if (clusterNumber) {
		var keys = Object.keys(plot_data.points);
		var highlightPoints;
		var highlightIdx;
		for (var idx in keys) {
			if (plot_data.points[idx].customdata.cluster_no === clusterNumber) {
				// Points are plotted in order of the data so push the highlighted cluster to the end
				// to ensure it is rendered last
				highlightPoints = plot_data.points[idx];
				highlightIdx = idx;
			} else {
				var point = plot_data.points[idx];
				point.marker.color = '#cccccc';
				point.hoverinfo = 'skip';
				point.hovertemplate = '';
				points.push(point);
			}
		}
		if (highlightPoints) {
			points.push(highlightPoints);
		}
		if (highlightIdx) {
			// Remove the highlighted cluster in the original array position so we dont plot it twice
			plot_data.points.splice(highlightIdx, 1);
		}

		if (plot_data.polygons) {
			if (typeof plot_data.polygons[clusterNumber] !== 'undefined') {
				polygons[clusterNumber] = plot_data.polygons[clusterNumber];
			}
		}
	} else {
		points = plot_data.points;
		polygons = plot_data.polygons;
	}

	var elem = document.getElementById(plotID);
	if (!title) {
		// eslint-disable-next-line no-underscore-dangle
		title = elem._fullLayout.title.text;
	}
	// eslint-disable-next-line no-underscore-dangle
	var showLegend = elem._fullLayout.showlegend;
	var showAxis = elem._fullLayout.showaxis;
	var config = plotlyConfigurations[elem.dataset.config];
	var layout = clusterCreateLayout(polygons, {'plot_type':'genes', 'showlegend':showLegend, 'showaxis':showAxis, 'title':title});
	Plotly.newPlot(plotID, points, layout, config);
}

// eslint-disable-next-line no-unused-vars
function assignColors(locations, colorMap) {
	return locations.map((code) => {
		if (colorMap.hasOwnProperty(code)) {
			return colorMap[code];
		}
		return colorMap.Multilocalizing;
	});
}

function mapSubcellCustomData(customdata) {
	var cdKeys = Object.keys(customdata);
	return customdata[cdKeys[0]].map(function(val, idx) {
		var d = {};
		// eslint-disable-next-line guard-for-in
		for (var k of cdKeys) {
			if (k === 'gene') {
				continue;
			}
			if (k === 'ensg') {
				var genes = customdata[k][idx].split(',');
				var ensgIDs = [];
				var geneIDs = [];
				for (var i = 0; i < genes.length; i++) {
					var g = genes[i].split(':');
					ensgIDs.push(g[0]);
					geneIDs.push(g[1]);
				}
				d.ensg = ensgIDs;
				d.gene = geneIDs;
			} else {
				d[k] = customdata[k][idx];
			}
		}
		return d;
	});
}

function showImageDetails(show) {
	if (show) {
		document.getElementById('imageDetails').style.display = 'block';
	} else {
		document.getElementById('imageDetails').style.display = 'none';
	}
}

function updateSubcellPlotCount(imageCount, geneCount) {
	$('#imageCount').html(imageCount);
	$('#geneCount').html(geneCount);
}

function getSubcellMarkerSize() {
	return document.querySelector('.markerSize').value;
}

function addPlotActions(plotID) {
	var plot = document.getElementById(plotID);
	plot.on('plotly_click', async function(data) {
		var detailsDiv = document.getElementById('imageData');
		var cd = data.points[0].customdata;
		detailsDiv.querySelector('.antibody .data').textContent = cd.antibody;
		detailsDiv.querySelector('.cellline .data').textContent = cd.cell_line;

		var geneElement = detailsDiv.querySelector('.genes .data');
		geneElement.innerHTML = '';
		var genes = cd.ensg;
		for (var i = 0; i < genes.length; i++) {
			var href = '/' + genes[i] + '-' + cd.gene[i] + '/subcellular';
			$(geneElement).append($('<p><a href="' + href + '">' + cd.gene[i] + '</a></p>'));
		}
		detailsDiv.querySelector('.genes .plural').style.display = genes.length > 1 ? '' : 'none';

		var locations = cd.locations.split(',');
		detailsDiv.querySelector('.location .data').innerHTML = locations.map(function(val) {
			return '<p>' + val + '</p>';
		}).join('');
		detailsDiv.querySelector('.location .plural').style.display = locations.length > 1 ? '' : 'none';

		// Image
		detailsDiv.querySelector('.image a').href = '/' + genes[0] + '-' + cd.gene[0] + '/subcellular#image_' + cd.img.split('/')[2];
		detailsDiv.querySelector('.image img').src = 'https://images.proteinatlas.org' + cd.img + '_blue_red_green_medium.jpg';
		showImageDetails(true);
	});
	var dragLayer = document.getElementsByClassName('nsewdrag')[0];
	plot.on('plotly_hover', function() {
		dragLayer.style.cursor = 'pointer';
	});
	plot.on('plotly_unhover', function() {
		dragLayer.style.cursor = '';
	});
}

function subcellPlotFilterHandler(event) {
	var id = event.target.id;
	// eslint-disable-next-line no-use-before-define
	filterClusterPlot(id, geneFilters);
}

// eslint-disable-next-line no-unused-vars
function subcell2DPlotConfig(id, dataIn) {
	if (!cluster_data.hasOwnProperty(id)) {
		var customdata = mapSubcellCustomData(dataIn.customdata);
		// eslint-disable-next-line no-undef
		var colors = assignColors(dataIn.customdata.locations, subcellColorMap);
		cluster_data[id] = {
			data: {
				x: dataIn.x,
				y: dataIn.y,
				colors: colors,
				customdata: customdata
			},
			trace: {
				x: [],
				y: [],
				type: 'scattergl',
				mode: 'markers',
				marker: {
					size: 2,
					// eslint-disable-next-line no-undef
					color: [],
				},
				hovertemplate: '%{customdata.gene}(%{customdata.cell_line}): %{customdata.locations}'
					+ '<extra></extra>',
				customdata: [],
			},
			layout: {
				hovermode: 'closest',
				xaxis: {
					showticklabels: false,
					nticks: 10,
					zeroline: false,
					showgrid: false,
					ticks: '',
					showline: true,
					title: {
						text: 'UMAP1'
					},
				},
				yaxis: {
					showticklabels: false,
					nticks: 10,
					zeroline: false,
					showgrid: false,
					ticks: '',
					showline: true,
					scaleanchor: 'x',
					scaleratio: 1,
					title: {
						text: 'UMAP2'
					},
				},
				margin: {
					l: 20,
					r: 5,
					t: 30,
					b: 20
				},
			},
			config: plotlyConfigurations.cell2d
		};
	}
	cluster_data[id].trace.marker.size = getSubcellMarkerSize();
	var trace = cluster_data[id].trace;
	trace.x = cluster_data[id].data.x;
	trace.y = cluster_data[id].data.y;
	trace.marker.color = cluster_data[id].data.colors;
	trace.customdata = cluster_data[id].data.customdata;
	var data = [
		trace,
	];
	var layout = JSON.parse(JSON.stringify(cluster_data[id].layout));
	var config = cluster_data[id].config;
	return {data: data, layout: layout, config: config};
}

function subcell2DPlotRender(id, dataIn, options) {
	let d = subcell2DPlotConfig(id, dataIn);
	var elem = document.getElementById(id);
	if (typeof options.width !== 'undefined') {
		d.layout.width = options.width;
		d.layout.height = options.height;
		elem.style.width = options.width + 'px';
		elem.style.height = options.height + 'px';
	}
	var pr = Plotly.newPlot(id, d.data, d.layout, d.config);
	pr.then(function() {
		if (typeof options.width === 'undefined') {
			elem.style.width = elem.clientWidth + 'px';
			elem.style.height = elem.clientHeight + 'px';
		}
		addPlotActions(id);
		$('#' + id).trigger('plot_filter');
	});
	return pr;
}

function loadSubcell2DPlot(id, options) {
	$('#' + id).html('<div class="loading"><img alt="loading" src="/images_static/loading.gif" class="loading"></div>');
	$.get({
		url: '/subcell/umap_data.php?data_name=subcell_umap_2d',
	}).done(function(data) {
		$('#' + id).on('plot_filter', subcellPlotFilterHandler);
		$('#filterGenes').on('change', function() {
			$('#' + id).trigger('plot_filter');
		});
		var pr = subcell2DPlotRender(id, data, options);
		pr.then(function() {
			$('#' + id + ' div.loading').remove();
		});
	});
}

// eslint-disable-next-line no-unused-vars
function subcell3DPlot(id, dataIn, options) {
	if (!cluster_data.hasOwnProperty(id)) {
		var customdata = mapSubcellCustomData(dataIn.customdata);
		// eslint-disable-next-line no-undef
		var colors = assignColors(dataIn.customdata.locations, subcellColorMap);
		cluster_data[id] = {
			data: {
				x: dataIn.x,
				y: dataIn.y,
				z: dataIn.z,
				colors: colors,
				customdata: customdata
			},
			trace: {
				x: [],
				y: [],
				z: [],
				type: 'scatter3d',
				mode: 'markers',
				marker: {
					size: 2,
					// eslint-disable-next-line no-undef
					color: [],
				},
				hovertemplate: '%{customdata.gene}(%{customdata.cell_line}): %{customdata.locations}'
					+ '<extra></extra>',
				customdata: [],
			},
			layout: {
				hovermode: 'closest',
				xaxis: {
					showticklabels: false,
					nticks: 10,
					zeroline: false,
					showgrid: false,
					ticks: '',
					showline: true,
					title: {
						text: 'UMAP1'
					},
				},
				yaxis: {
					showticklabels: false,
					nticks: 10,
					zeroline: false,
					showgrid: false,
					ticks: '',
					showline: true,
					scaleanchor: 'x',
					scaleratio: 1,
					title: {
						text: 'UMAP2'
					},
				},
				margin: {
					l: 20,
					r: 5,
					t: 30,
					b: 20
				},
			},
			config: plotlyConfigurations.cell3d
		};
	}

	cluster_data[id].trace.marker.size = getSubcellMarkerSize();
	var trace = cluster_data[id].trace;
	trace.x = cluster_data[id].data.x;
	trace.y = cluster_data[id].data.y;
	trace.z = cluster_data[id].data.z;
	trace.marker.color = cluster_data[id].data.colors;
	trace.customdata = cluster_data[id].data.customdata;
	var data = [
		trace,
	];
	var layout = JSON.parse(JSON.stringify(cluster_data[id].layout));
	var elem = document.getElementById(id);
	if (typeof options.width !== 'undefined') {
		layout.width = options.width;
		layout.height = options.height;
		elem.style.width = options.width + 'px';
		elem.style.height = options.height + 'px';
	}
	var config = cluster_data[id].config;
	var pr = Plotly.newPlot(id, data, layout, config);
	pr.then(function() {
		if (typeof options.width === 'undefined') {
			elem.style.width = elem.clientWidth + 'px';
			elem.style.height = elem.clientHeight + 'px';
		}
		addPlotActions(id);
		$('#' + id).trigger('plot_filter');
	});
	return pr;
}

function loadSubcell3DPlot(id, options) {
	$('#' + id).html('<div class="loading"><img alt="loading" src="/images_static/loading.gif" class="loading"></div>');
	$.get({
		url: '/subcell/umap_data.php?data_name=subcell_umap_3d',
	}).done(function(data) {
		$('#' + id).on('plot_filter', subcellPlotFilterHandler);
		var pr = subcell3DPlot(id, data, options);
		pr.then(function() {
			$('#' + id + ' div.loading').remove();
		});
	});
}

// eslint-disable-next-line no-unused-vars
function toggleClusterPlot(id) {
	$('#clusterPlots .clusterPlot').removeClass('active');
	$('#' + id).css('display', 'block').addClass('active');
	var current = $('.clusterPlot:not(#' + id + ')');
	var options = {
		width: undefined,
		height: undefined,
	};
	try {
		options.width = current.get(0).clientWidth;
		if (options.width === 0) {
			options.width = undefined;
		} else {
			options.height = current.get(0).clientHeight;
		}
		// eslint-disable-next-line no-empty
	} catch (e) {
	}
	$('.clusterPlot:not(#' + id + ')').css('display', 'none');
	if (!document.getElementById(id).classList.contains('js-plotly-plot')) {
		if (id === 'cellClusterPlot3D') {
			loadSubcell3DPlot(id, options);
		} else {
			loadSubcell2DPlot(id, options);
		}
	} else {
		$('#' + id).trigger('plot_filter');
	}
}

function getSubcellGeneFilterFunc(genes) {
	var filterFunc;
	if (typeof genes === 'undefined') {
		filterFunc = function () {
			return true;
		};
	} else {
		filterFunc = function (val, idx, that) {
			var ensgIDs = that.customdata[idx].ensg;
			if (ensgIDs.length === 1) {
				return genes.indexOf(ensgIDs[0]) !== -1;
			}
			for (var i = 0; i < ensgIDs.length; i++) {
				if (genes.indexOf(ensgIDs[i]) !== -1) {
					return true;
				}
			}
			return false;
		};
	}
	return filterFunc;
}

// eslint-disable-next-line no-unused-vars
function filterClusterPlot(id, filters) {
	var dataTemp = cluster_data[id].trace;
	if (typeof filters.location === 'undefined' && typeof filters.genes === 'undefined') {
		// Empty filter
		dataTemp.x = cluster_data[id].data.x;
		dataTemp.y = cluster_data[id].data.y;
		if (cluster_data[id].data.hasOwnProperty('z')) {
			dataTemp.z = cluster_data[id].data.z;
		}
		dataTemp.marker.color = cluster_data[id].data.colors;
		dataTemp.customdata = cluster_data[id].data.customdata;
	} else {
		// Non-empty filter
		var f2 = {};
		var filterFunc = (function () {
			var locFilter = getSubcellLocationFilterFunc(filters.location);
			var geneFilter = getSubcellGeneFilterFunc(filters.genes);
			return function (val, idx) {
				// noinspection JSCheckFunctionSignatures
				if (locFilter(val, idx, this) && geneFilter(val, idx, this)) {
					f2[idx] = 1;
					return true;
				}
				return false;
			};
		}());
		var filterFunc2 = function (val, idx) {
			return f2.hasOwnProperty(idx);
		};
		dataTemp.x = cluster_data[id].data.x.filter(filterFunc, cluster_data[id].data);
		dataTemp.y = cluster_data[id].data.y.filter(filterFunc2);
		if (cluster_data[id].data.hasOwnProperty('z')) {
			dataTemp.z = cluster_data[id].data.z.filter(filterFunc2);
		}
		dataTemp.marker.color = cluster_data[id].data.colors.filter(filterFunc2);
		dataTemp.customdata = cluster_data[id].data.customdata.filter(filterFunc2);
	}
	dataTemp.marker.size = getSubcellMarkerSize();
	var data = [
		dataTemp,
	];
	var imageCount = dataTemp.x.length;
	var genes = {};
	dataTemp.customdata.forEach(function(val) {
		for (var i = 0; i < val.ensg.length; i++) {
			genes[val.ensg[i]] = 1;
		}
	});
	var geneCount = Object.keys(genes).length;
	var layout = cluster_data[id].layout;
	var config = cluster_data[id].config;
	var pr = Plotly.react(id, data, layout, config);
	pr.then(function() {
		showImageDetails(false);
		updateSubcellPlotCount(imageCount, geneCount);
	});
}

function getSubcellLocationFilterFunc(names) {
	var filterFunc;
	if (typeof names !== "undefined" && names.length) {
		filterFunc = function(val, idx, that) {
			for (var i = 0; i < names.length; i++) {
				var name = names[i];
				var regex = new RegExp('(^|, *)' + name + '(, *|$)');
				if (name === 'Multilocalizing') {
					if (that.customdata[idx].locations.includes(',')) {
						return true;
					}
				} else if (that.customdata[idx].locations.match(regex)) {
					return true;
				}
			}
			return false;
		};
	} else {
		filterFunc = function () {
			return true;
		};
	}
	return filterFunc;
}

function getSubcellActivePlotID() {
	return $('#clusterPlots .clusterPlot.active').attr('id');
}

$(function() {
	$('body').on('click', '.show_text > div.text_toggle span', function() {
		var body = $(this).closest('.show_text');
		if (body.hasClass('show')) {
			if (window.pageYOffset + 110 > body.offset().top) {
				$(document).scrollTop(body.offset().top - 110);
			}
		}
		body.toggleClass('show');
	});
	// remove tooltip from atlasImage on single nuclei brain
	$('.learnbody[markdown_name^="/humanproteome/single cell/single nuclei brain/"] .atlasImage span a').attr("title","");
	
	var markerSize = $('#cellUMAP .markerSize');
	markerSize.selectmenu({
		width: 130,
		appendTo: '#plotMenu',
		position: {
			collision: 'flip',
		},
	});
	markerSize.on('selectmenuchange', function() {
		$(this).trigger('change');
	}).on('change', function() {
		var size = $(this).val();
		var id = getSubcellActivePlotID();
		Plotly.restyle(id, { 'marker.size': size });
	});

	document.addEventListener('fullscreenchange', () => {
		var plots;
		var i;
		var element = document.getElementById('fullScreenSubcell');
		if (!element) {
			return;
		}
		if (document.fullscreenElement) {
			element.querySelector('.left.legend').appendChild(document.getElementById('locationLegend'));
			element.querySelector('.middle .plot').appendChild(document.getElementById('plotPlacement'));
			element.querySelector('.right.details').appendChild(document.getElementById('imageDetails'));
			element.querySelector('.middle .search').appendChild(document.getElementById('filterGenes'));
			element.style.display = null;
			var plotElem = element.querySelector('#fullScreenSubcell .plotSize');
			plots = document.querySelectorAll('.plot .clusterPlot.js-plotly-plot');
			var maxHeightSearch = 125;
			if (!element.querySelector('.middle .search')) {
				maxHeightSearch = 0;
			}
			var elemHeight = plotElem.clientHeight - document.querySelector('.middle #plotMenu').clientHeight - maxHeightSearch;
			var size = Math.max(plotElem.clientWidth, elemHeight);
			for (i = 0; i < plots.length; i++) {
				plots[i].style.width = size + 'px';
				plots[i].style.height = size + 'px';
				Plotly.relayout(plots[i], {
					width: size,
					height: size,
				});
			}
		} else {
			// Exiting fullscreen
			// Revert all elements to their previous position
			document.getElementById('locationLegendPlacement').appendChild(document.getElementById('locationLegend'));
			document.getElementById('plotDiv').prepend(document.getElementById('plotPlacement'));
			document.getElementById('rightDetails').appendChild(document.getElementById('imageDetails'));
			document.getElementById('filterPlacement').appendChild(document.getElementById('filterGenes'));
			element.style.display = 'none';
			plots = document.querySelectorAll('.clusterPlot.js-plotly-plot');
			for (i = 0; i < plots.length; i++) {
				plots[i].style.width = plots[i].parentElement.dataset.originalWidth + 'px';
				plots[i].style.height = plots[i].parentElement.dataset.originalHeight + 'px';
				Plotly.relayout(plots[i], {
					width: plots[i].parentElement.dataset.originalWidth,
					height: plots[i].parentElement.dataset.originalHeight
				});
			}
		}
	});
});

$.fn.cellinePathway = function(data, inSettings) {
    var plot = {};
    var extraDefaults = {
        yLabels: '',
        yTickFormat: '',
        minY: 0,
        dimension: {w: 850, h: 300},
        padding: {t: 20, r: 20, b: 85, l: 50},
        bgColor: '',
        barWidth: 11,
        xLabelsHide: false,
        extendedTooltip: false
    };
    var settings = addDefaultPlotSettings(inSettings, extraDefaults);
    plot.settings = settings;
    // Inner dimension
    var width = plot.width = settings.dimension.w - settings.padding.l - settings.padding.r; // inner width
    var height = plot.height = settings.dimension.h - settings.padding.t - settings.padding.b; // inner height

    var xScale = plot.x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(function(d) { return d.label; }));
    var xAxis = d3.axisBottom(xScale)
        .tickSizeOuter(0)
        .tickSize(0);

    if (settings.xLabelsHide) {
        xAxis
            .tickFormat('')
            .tickSize(0);
    }
    var yScale;
    var yMin, yMax, yAxis;
    if (settings.yLabels) {
        yMin = plot.yMin = d3.min(d3.keys(settings.yLabels));
        yMax = plot.yMax = d3.max(d3.keys(settings.yLabels));
        yScale = plot.y = d3.scaleLinear()
            .range([height, 0])
            .domain([yMin, yMax]);
        yAxis = d3.axisLeft(yScale)
            //.tickFormat(function(d) { return settings.yLabels[d]; })
        //.tickValues(d3.keys(settings.yLabels));
    }
    else {
        yMin = plot.yMin = Math.min(d3.min(data, function(d) { return parseFloat(d.value); }), settings.minY);
        yMax = plot.yMax = Math.max(d3.max(data, function(d) { return parseFloat(d.value); }), settings.minY);
        yScale = plot.y = d3.scaleLinear()
            .range([height, 0])
            .domain([yMin, yMax])
            .nice(5);
        yAxis = d3.axisLeft(yScale)
            .ticks(5);
        if (settings.yTickSize != undefined) {
            yAxis.tickSize(settings.yTickSize);
        }
        if (settings.yTickFormat) {
            yAxis.tickFormat(d3.format(settings.yTickFormat));
        }
    }
    var vis = plot.vis = d3.select($(this).get(0))
        .append("svg")
        .attr("class", "barchart")
        .attr("width", width + settings.padding.l + settings.padding.r)
        .attr("height", height + settings.padding.t + settings.padding.b)
        .append("g")
        .attr("transform", "translate(" + settings.padding.l + "," + settings.padding.t + ")")
        .attr("width", width)
        .attr("height", height);

    $(this).on('click', '[url]', function() {
        document.location.href = $(this).attr('url');
    });

    if (settings.bgColor) {
        vis.append("rect")
            .attr("class", "chart_field")
            .attr("width", width)
            .attr("height", height+4)
            .attr("transform", "translate(0,-4)")
            .style("fill", settings.bgColor);
    }

    var bar_g = vis.selectAll(".bar_g")
        .data(data)
        .enter()
        .append("g")
        .attr("class", function(d) { return d.class? "bar_g "+d.class : "bar_g"; })
        .attr("transform", function(d) { return 'translate('+xScale(d.label)+', 0)'; })
        .attr("title", function(d) { return d.tooltip; });

    var link = bar_g.append("a")
        .each(function(d) { if (d.url) d3.select(this).attr("xlink:href", d.url); });

    if (settings.extendedTooltip) {
        var bar_transp = link.append("rect")
            .attr("class","bartrans")
            .attr("y", 0)
            .attr("x", function(d) { return xScale.bandwidth()/2 - settings.barWidth/2 ; })
            .attr("width", settings.barWidth)
            .attr("height", height)
            .style("fill", "transparent");
    }
    var bar_line = link.append("line")
        .attr("class","bar")
        .style("stroke", "grey")
        .style("stroke-width", 0.5)
        .attr("y1", function(d) { return yScale(0); })
        .attr("x1", function(d) { return xScale.bandwidth()/2 ; })
        .attr("y2", function(d) { return yScale(d.value);})
        .attr("x2", function(d) { return xScale.bandwidth()/2 ; })
    var bar_circle = link.append("circle")
        .attr("class", "bar")
        //.attr("transform", "translate(0,0)")
        .attr("cy", function(d) { return yScale(d.value); })
        .attr("cx", function(d) { return xScale.bandwidth()/2 ; })
        .attr("r", function(d) { if(d.group == 'Significant') {return 4} else {return 2}})
        //.style("stoke","1px solid black")
        .style("stroke", "grey")
        //.attr("width", settings.barWidth)
        //.attr("height", function(d) { return (d.na == 1)?height:(height-yScale(d.value));})
        .style("fill", function(d){
            if (d.na==1) {
                return "#FAFAFA";
            } else if (typeof d.color_group!='undefined') {
                return colorbrewer[d.color_group[0]][d.color_group[1]][d.color_group[2]];
            } else {
                if(d.group == 'Significant') {
                    if (d.value > 0) {
                        return 'red';
                    } else {
                        return '#1560BD';
                    }
                } else {
                    if (d.value > 0) {
                        return '#FFCCCB';
                    } else {
                        return 'lightblue';
                    }
                }
            }
        });

    var bar_text = bar_g.filter(function(d){ return d.na == 1; })
        .append("text")
        .attr("class", "na_text")
        .style("text-anchor", "middle")
        .attr("y", settings.barWidth/2+6)
        .attr("x", -height/2)
        .text("N/A");

    if (settings.valueLabels) {
        link.append("text")
            .attr("class", "valueLabel")
            .style("text-anchor", "middle")
            .attr("x", function(d, i) { return xScale.bandwidth()/2; })
            .attr("y", function(d) { return (d.na == 1)?0:yScale(d.value)-2; })
            .text(function(d) { return (d.na == 1)?'':d.value; });
    }

    vis.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + yScale(0) + ")")
        .call(xAxis)
        .selectAll(".tick text")
        .attr("class", "barchartlabel")
        //.style("text-anchor", function(d,i) {if(data[i].value<0) {console.log(d);return "start"} else {console.log(d);return "end"}})
        .attr("transform","rotate(-90)")

        .each(function(d, i) {
            if (data[i].tooltip) {
                var yd = 0;
                if (data[i].value < 0) {
                    var xd = 4;
                    var anchor = "start";
                } else {
                    xd = -4;
                    anchor = "end";
                }
                d3.select(this).attr('title', data[i].tooltip)
                    .attr("y", -4)
                    .attr("x", xd)
                    .style("text-anchor", anchor);
            }
            if (data[i].url) {
                d3.select(this).attr('url', data[i].url).style('cursor', 'pointer');
            }
        });

    // x axis label
    vis.selectAll(".x.axis")
        .append("text")
        .attr("y", 200)
        .attr("x", width/2)
        .text(settings.xAxisLabel);
    // y axis label
    vis.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("y", -8)
        .style("text-anchor", "middle")
        .text(settings.yAxisLabel);

    vis.selectAll(".y .tick text")
        .call(wrap, settings.padding.l);

    // Legend
    if (settings.legend !== '') {
        var x_pos = 320;
        var y_pos = 0;
        vis.append("circle").attr("cx",x_pos).attr("cy",y_pos).attr("r", 4).style("fill", "rgb(255, 26, 26)").style("stroke","grey");
        vis.append("text").attr("x", x_pos+10).attr("y", y_pos).text("Significant - upregulated").style("font-size", "11px").attr("alignment-baseline","middle")

        vis.append("circle").attr("cx",x_pos).attr("cy",y_pos+20).attr("r", 4).style("fill", "#0000FF").style("stroke","grey");
        vis.append("text").attr("x", x_pos+10).attr("y", y_pos+20).text("Significant - downregulated").style("font-size", "11px").attr("alignment-baseline","middle")

        vis.append("circle").attr("cx",x_pos).attr("cy",y_pos+40).attr("r", 2).style("fill", "lightgrey").style("stroke","grey")
        vis.append("text").attr("x", x_pos+10).attr("y", y_pos+40).text("Non significant").style("font-size", "11px").attr("alignment-baseline","middle")
    }

    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }
    return plot;
};
