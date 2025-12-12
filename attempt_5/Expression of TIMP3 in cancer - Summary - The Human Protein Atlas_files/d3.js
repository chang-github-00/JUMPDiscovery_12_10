/* global $,d3 */

//## Sortable barchart ##
$.fn.barChart = function(data, inSettings) {
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
	var xAxis = plot.xAxis = d3.axisBottom(xScale)
		.tickSizeOuter(0);

	if (settings.xLabelsHide) {
		xAxis
			.tickFormat('')
			.tickSize(0);
	}

	var yScale;
	var yMin, yMax, yAxis;
	if (settings.yLabels) {
		yMin = plot.yMin = 0;
		yMax = plot.yMax = d3.max(d3.keys(settings.yLabels));
		yScale = plot.y = d3.scaleLinear()
			.range([height, 0])
			.domain([yMin, yMax]);
		yAxis = d3.axisLeft(yScale)
			.tickFormat(function(d) { return settings.yLabels[d]; })
			.tickValues(d3.keys(settings.yLabels));
	}
	else {
		yMin = plot.yMin = (plot.settings.minY >= 0) ? 0 : plot.yMin = Math.min(d3.min(data, function(d) { return parseFloat(d.value); }), settings.minY);
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
		.attr("class", function(d) { return d.class? "bar_g " + d.class : "bar_g"; })
		.attr("transform", function(d) { return 'translate(' + xScale(d.label) + ', 0)'; })
		.attr("title", function(d) { return d.tooltip; });

	var link = bar_g.append("a")
		.each(function(d) { if (d.url) d3.select(this).attr("xlink:href", d.url); });

	if (settings.extendedTooltip) {
		var bar_transp = link.append("rect")
			.attr("class","bartrans")
			.attr("y", 0)
			.attr("x", function(d) { return xScale.bandwidth() / 2 - settings.barWidth / 2; })
			.attr("width", settings.barWidth)
			.attr("height", height)
			.style("fill", "transparent");
	}

	var bar_rect = link.append("rect")
		.attr("class", "bar")
		.attr("y", function(d) {
			return (d.na == 1)?0:yScale(Math.max(0, d.value));
		})
		.attr("x", function(d) { return xScale.bandwidth() / 2 - settings.barWidth / 2 ; })
		.attr("width", settings.barWidth)
		.attr("height", function(d) {
			return (d.na == 1)?height:Math.abs(yScale(d.value) - yScale(0));
		})
		.style("fill", function(d){
			if (d.na == 1) {
				return "#FAFAFA";
			} else if (typeof d.color_group != 'undefined') {
				return colorbrewer[d.color_group[0]][d.color_group[1]][d.color_group[2]];
			} else {
				return d.color;
			}
		});

	var bar_text = bar_g.filter(function(d) { return d.na == 1; })
		.append("text")
		.attr("class", "na_text")
		.style("text-anchor", "middle")
		.attr("transform", "rotate(-90)")
		.attr("y", settings.barWidth / 2 + 6)
		.attr("x", -height / 2)
		.text("N/A");

	if (settings.valueLabels) {
		link.append("text")
			.attr("class", "valueLabel")
			.style("text-anchor", "middle")
			.attr("x", function(d, i) { return xScale.bandwidth() / 2; })
			.attr("y", function(d) { return (d.na == 1) ? 0 : yScale(d.value) - 2; })
			.text(function(d) { return (d.na == 1) ? '' : d.value; });
	}

	vis.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.selectAll(".tick text")
		.attr("class", "barchartlabel")
		.attr("y", 0)
		.attr("x", -9)
		.attr("transform", "rotate(-55)")
		.style("text-anchor", "end")
		.each(function(d, i) {
			if (data[i].tooltip) {
				d3.select(this).attr('title', data[i].tooltip);
			}
			if (data[i].url) {
				d3.select(this).attr('url', data[i].url).style('cursor', 'pointer');
			}
		});

	if (plot.settings.minY < 0) {
		// zero line
		vis.append("line")
			.attr("class", "barchartlabel")
			.attr("x1", 0)
			.attr("x2", width)
			.attr("y1", yScale(0) + 0.5)
			.attr("y2", yScale(0) + 0.5)
			.attr("stroke", "#000")
			.attr("stroke-width", "1");
	}

	// x axis label
	vis.selectAll(".x.axis")
		.append("text")
		.attr("y", 20)
		.attr("x", width / 2)
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
		var legend = vis.selectAll(".legend")
			.data(d3.map(data, function(d) { return d.legend; }).values())
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(0," + i * (settings.barWidth + 2) + ")"; });

		legend.append("rect")
			.attr("x", settings.legend.x)
			.attr("y", settings.legend.y)
			.attr("width", settings.barWidth)
			.attr("height", settings.barWidth)
			.style("fill", function(d, i) { return d.color; });

		legend.append("text")
			.attr("x", settings.legend.x + settings.barWidth + 2)
			.attr("y", settings.legend.y + settings.barWidth / 2)
			.attr("dy", ".35em")
			.style("text-anchor", settings.legend.txtAnchor)
			.text(function(d) { return d.legend; });
	}

	$(this).on('sort', function(e, order) {
		var x0 = xScale.domain(
			data.sort(
				order === 'pos' ? function(a, b) { return a.pos - b.pos; }
					: order === 'value' ? function(a, b) { return a.na ? 1000 : b.na ? -1000 : b.value - a.value; }
						: order === 'real_value' ? function(a, b) { return a.na ? 1000 : b.na ? -1000 : b.real_value - a.real_value; }
							: order === 'label' ? function(a, b) { return a.label.localeCompare(b.label); }
								: order === 'origin' ? function(a, b) { return a.origin.localeCompare(b.origin); }
									: order === 'category' ? function(a, b) { return a.category.localeCompare(b.category); }
										: function(a, b) { return 0; }
			)
				.map(function(d) { return d.label; })
		).copy();

		vis.selectAll(".bar_g").sort(function(a, b) { return x0(a.value) - x0(b.value); });
		vis.selectAll(".x.axis.tick").sort(function(a, b) { return x0(a.value) - x0(b.value); });

		var transition = vis.transition().duration(100);
		transition.selectAll(".bar_g")
			.attr("transform", function(d) { return 'translate(' + x0(d.label) + ', 0)'; });
		transition.select(".x.axis")
			.call(xAxis)
			.selectAll(".tick text")
			.style("text-anchor", "end")
			.attr("y", 0)
			.attr("x", -9);
	});

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

//## Horizontal sortable barchart ##
$.fn.horizontalBarChart= function(data, inSettings) {
	var plot = {};
	var extraDefaults = {
		yLabels: '',
		yTickFormat: '',
		minX: 0,
		dimension: {w: 500, h: 300},
		padding: {t: 20, r: 20, b: 20, l: 150},
		bgColor: '',
		barHeight: 15,
		xAxis: true,
		yLabelsHide: false,
		yLabelsChars: 0,
		extendedTooltip: false
	};
	var settings = addDefaultPlotSettings(inSettings, extraDefaults);
	plot.settings = settings;
	
	// Inner dimension
	var width = plot.width = settings.dimension.w - settings.padding.l - settings.padding.r; // inner width
  var height = plot.height = settings.dimension.h - settings.padding.t - settings.padding.b; // inner height
	
	var yScale = plot.y = d3.scaleBand()
		.range([0, height])
		.domain(data.map(function(d) { return d.label; }));
	var yAxis = d3.axisLeft(yScale)
		.tickSizeOuter(0);

	if (settings.yLabelsHide) {
		yAxis
		.tickFormat('')
		.tickSize(0);
	}
	var xScale;
	var xMin, xMax, xAxis;
	if (settings.xLabels) {
		xMin = plot.xMin = 0;
		xMax = plot.xMax = d3.max(d3.keys(settings.xLabels));
		xScale = plot.x = d3.scaleLinear()
			.range([0, width])
			.domain([xMin, xMax]);
		xAxis = d3.axisTop(xScale)
			.tickFormat(function(d) { return settings.xLabels[d]; })
			.tickValues(d3.keys(settings.xLabels));
	}
	else {
		xMin = plot.xMin = 0;
		xMax = plot.xMax = Math.max(d3.max(data, function(d) { return parseFloat(d.value); }), settings.minX);
		xScale = plot.x = d3.scaleLinear()
			.range([0, width])
			.domain([xMin, xMax])
			.nice(5);
		xAxis = d3.axisTop(xScale)
			.ticks(5);
		if (settings.xTickSize != undefined) {
			xAxis.tickSize(settings.xTickSize);
		}
		if (settings.xTickFormat) {
			xAxis.tickFormat(d3.format(settings.xTickFormat));
		}
	}
	var vis = plot.vis = d3.select($(this).get(0))
		.append("svg")
		.attr("class", "horizbarchart")
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
		.attr("transform", function(d) { return 'translate(0, '+yScale(d.label)+')'; })
		.attr("title", function(d) { return d.tooltip; });
		
	var link = bar_g.append("a")
		.each(function(d) { if (d.url) d3.select(this).attr("xlink:href", d.url); });
	
	if (settings.extendedTooltip) {
		var bar_transp = link.append("rect")
			.attr("class","bartrans")
			.attr("x", 0)
			.attr("y", function(d) { return yScale.bandwidth()/2 - settings.barHeight/2 ; })
			.attr("height", settings.barHeight)
			.attr("width", width)
			.style("fill", "transparent");
	}
	var bar_rect = link.append("rect")
		.attr("class", "bar")
		.attr("x", 0)
		.attr("y", function(d) { return yScale.bandwidth()/2 - settings.barHeight/2 ; })
		.attr("height", settings.barHeight)
		.attr("width", function(d) { return (d.na == 1)?0:(xScale(d.value));})
		.style("fill", function(d){
			if (d.na==1) {
					return "#FAFAFA";
			} else if (typeof d.color_group!='undefined') {
				return colorbrewer[d.color_group[0]][d.color_group[1]][d.color_group[2]];
			} else {
				return d.color;
			}
		});
		
	var bar_text = bar_g.filter(function(d){ return d.na == 1; })
		.append("text")
		.attr("class", "na_text")
		.style("text-anchor", "middle")
		.attr("transform", "rotate(-90)")
		.attr("x", settings.barHeight/2+6)
		.attr("y", width/2)
		.text("N/A");
	
	if (settings.valueLabels) {
		link.append("text")
			.attr("class", "valueLabel")
			.style("text-anchor", "start")
			.attr("x", function(d) { return (d.na == 1)?0:xScale(d.value)+2; })
			.attr("y", function(d, i) { return yScale.bandwidth()/2 + settings.barHeight/2-4; })
			.text(function(d) { return (d.valueLabel!=undefined)? d.valueLabel : ((d.na == 1)?'':d.value); });
	}
	
	// x axis
	if (settings.xAxis) {
		vis.append("g")
			.attr("class", "x axis")
			.call(xAxis)
			.selectAll(".tick text")
			.attr("class", "barchartlabel")
			.attr("x", 0)
			.attr("y", -9)
			.style("text-anchor", "end");
		vis.selectAll(".x.axis")
			.append("text")
			.attr("x", width/2)
			.attr("y", -20)
			.text(settings.xAxisLabel);
	}
	// y axis
	vis.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
		.attr("y", -8)
		.style("text-anchor", "middle")
		.text(settings.yAxisLabel);
	if (settings.yLabelsChars) {
		vis.selectAll(".y.axis .tick text").each(function(d) {
			if (d3.select(this).text().length > settings.yLabelsChars) {
				d3.select(this)
					.attr('title', d3.select(this).text())
					.text(d3.select(this).text().substring(0,settings.yLabelsChars) + '...');
			}
		});
	}
	else {
		vis.selectAll(".y .tick text")
			.call(wrap, settings.padding.l);
	}
	
	// Legend
	if (settings.legend !== '') {
		var legend = vis.selectAll(".legend")
			.data(d3.map(data, function(d){return d.legend;}).values())
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(0," + i * (settings.barHeight+2) + ")"; });

		legend.append("rect")
			.attr("x", settings.legend.x)
			.attr("y", settings.legend.y)
			.attr("width", settings.barHeight)
			.attr("height", settings.barHeight)
			.style("fill", function(d, i) {return d.color; });

		legend.append("text")
			.attr("x", settings.legend.x+settings.barHeight+2)
			.attr("y", settings.legend.y+settings.barHeight/2)
			.attr("dy", ".35em")
			.style("text-anchor", settings.legend.txtAnchor)
			.text(function(d) { return d.legend; });
		
	}
	
	$(this).on('sort', function(e, order) {
		var y0 = yScale.domain(
			data.sort(
				order==='pos'? function(a, b) { return a.pos - b.pos; }
				:order==='value'? function(a, b) { return a.na? 1000 : b.na? -1000 : b.value - a.value; }
				:order==='real_value'? function(a, b) { return a.na? 1000 : b.na? -1000 : b.real_value - a.real_value; }
				:order==='label'? function(a, b) { return a.label.localeCompare(b.label); }
				:order==='origin'? function(a, b) { return a.origin.localeCompare(b.origin); }
				:order==='category'? function(a, b) { return a.category.localeCompare(b.category); }
				: function(a,b) { return 0; }
			)
			.map(function(d) { return d.label; })
		)
		.copy();
		
    vis.selectAll(".bar_g").sort(function(a, b) { return y0(a.value) - y0(b.value); });
    vis.selectAll(".y.axis.tick").sort(function(a, b) { return y0(a.value) - y0(b.value); });

    var transition = vis.transition().duration(100);
    transition.selectAll(".bar_g")
			.attr("transform", function(d) { return 'translate(0, '+y0(d.label)+')'; });
		transition.select(".y.axis")
			.call(yAxis)
			.selectAll(".tick text")
			.style("text-anchor", "end")
			.attr("x", 0)
			.attr("y", -9);
  });

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

$.fn.horizBarChart = function(data, inSettings) {
	var plot = {};
	var extraDefaults = {
		yLabels: '',
		yTickFormat: '',
		minY: 0,
		dimension: {w: 400, h: 300},
		padding: {t: 20, r: 20, b: 20, l: 100},
		bgColor: '',
		barheight: 11,
		xLabelsHide: false,
		extendedTooltip: false
	};
	var settings = addDefaultPlotSettings(inSettings, extraDefaults);
	plot.settings = settings;
	
	// Inner dimension
	var width = plot.width = settings.dimension.w - settings.padding.l - settings.padding.r; // inner width
  var height = plot.height = settings.dimension.h - settings.padding.t - settings.padding.b; // inner height
	
	
	
	var defaultColorScale = ["#CCCCFF", "#0000FF"];
	if (typeof settings == "undefined") settings = {};
	if (typeof settings.colorset != "undefined") {
		if (settings.colorset == "blue") {
			settings.colorscale = defaultColorScale;
		} else if (settings.colorset == "red") {
			settings.colorscale = ["#FFCCCC", "#FF0000"];
		} else if (settings.colorset == "Cytoplasm") {
			settings.colorscale = ["#bede8a", "#94c83d"];
		} else if (settings.colorset == "Nucleus") {
			settings.colorscale = ["#87d3ff", "#017bc0"];
		} else if (settings.colorset == "Endomembrane system") {
			settings.colorscale = ["#ffaf91", "#f26531"];
		}
	}
	if (typeof settings.colorscale == 'undefined') settings.colorscale = defaultColorScale;
	if (typeof settings.dimension == 'undefined') settings.width = 600;
	if (typeof settings.barheight == 'undefined') settings.barheight = 20;
	if (typeof settings.bgcolor == 'undefined') settings.bgcolor = "#FFFFFF";
	if (typeof settings.maxvalue == 'undefined') settings.maxvalue = 40;
	if (typeof settings.xAxisLabel == 'undefined') settings.xAxisLabel = '';
	if (typeof settings.padding == 'undefined') settings.padding = {'top': 30, 'bottom': 0, 'left': 200, 'right': 40};
	if (typeof settings.xLabelTransform == 'undefined') settings.xLabelTransform = '';
	if (typeof settings.valueLabels == 'undefined') settings.valueLabels = false;
	if (typeof settings.grid == 'undefined') settings.grid = false;
	if (typeof settings.showRows == 'undefined') settings.showRows = false;
	var barHeight = settings.barheight;
	var chartHeight = settings.barheight * data.length;
	var height = chartHeight + settings.padding.top + settings.padding.bottom;
	var chartWidth = settings.width - settings.padding.left - settings.padding.right;
	var svg = d3.select(id)
			.attr("tabindex", 1)
			.append("svg")
			.attr("class", "chart cluster")
			.attr("width", settings.width)
			.attr("height", height);
	if (settings.bgColor != '') {
		svg.append("rect")
				.attr("class", "background")
				.attr("width", settings.width)
				.attr("height", height)
				.attr("fill", settings.bgcolor);
	}
	var chart = svg
			.append("g")
			.attr("width", chartWidth)
			.attr("height", chartHeight)
			.attr("transform", "translate("+settings.padding.left+","+settings.padding.top+")");

	// Bar color
	var color = d3.scaleLinear()
			.domain([0, settings.maxvalue])
			.range(settings.colorscale);

	// X axis
	var x = d3.scaleLinear()
			.range([0, chartWidth])
			.domain([0, d3.max(data, function(d){ return d.value;})]);
	var xAxis = d3.axisTop().scale(x).tickSizeOuter(0);
	if (settings.grid) xAxis.tickSizeInner(-chartHeight);

	// Y axis
	var y = d3.scaleBand()
			.range([0, chartHeight])
			.domain(data.map(function(d){return d.name;}));
	var yAxis = d3.axisLeft().scale(y).tickSizeOuter(0);

	chart.append("g")
		.attr("class", "x axis")
		.call(xAxis);

	chart.selectAll(".x.axis")
		.append("text")
		.attr("class", "xAxisLabel")
		.attr("y", -20)
		.attr("x", chartWidth/2)
		.style("text-anchor", "middle")
		.style("fill", "#000")
		.text(settings.xAxisLabel);
	
	// The bar's
	var bar = chart.selectAll("rect")
				.data(data)
				.enter().append("g")
				.attr("class", "bar")
				.attr("transform", function(d, i) { return "translate(0," + i * settings.barheight + ")"; });
	// The visual bar
	var link = bar.append("a")
		.attr("xlink:href", function(d) {return d.url;});
	link.append("rect")
		.attr("width", function(d) {return x(d.value)})
		.attr("height", settings.barheight-1)
		.attr("fill", function(d){return color(d.value)})
		.attr("y", 0)
		.attr("title", function(d){return d.value_tooltip})
		.on("mouseover", function(d, i) {
			var r = getHighlightColor($(this).css("fill"));
			$(this).attr("fill-old", $(this).css("fill"));
			d3.select(this).transition().style("fill", 'rgb('+r[1]+','+r[2]+','+r[3]+')');
    })
    .on("mouseout", function(d, i) {
			if($(this).attr("fill-old")) {
				d3.select(this).transition().style("fill", $(this).attr("fill-old"));
			}
    });
	if (settings.valueLabels) {
		bar.append("text")
			.text(function(d) {return d.value;})
			.attr("text-align", "right")
			.attr("dominant-baseline", "middle")
			.attr("y", barHeight/2)
			.attr("x", function(d) {return x(d.value)+2});
	}
	
	chart.append("g")
		.attr("class", "y axis")
		.attr("width", settings.padding.left-5)
		.call(yAxis);
	chart.selectAll(".y.axis text").attr("width", settings.padding.left-5).text(function(d) {if (d.length>31) {return d.substring(0,28)+"...";} else return d;})
		//.attr("x", 40);
	adjustClusterPlot(id);
	
	return plot;
};



//## Grouped barchart ##
$.fn.groupedBarChart = function(data, inSettings) {
	var extraDefaults = {
		padding: {t: 10, r: 10, b: 20, l: 30}
	};
	var settings = addDefaultPlotSettings(inSettings, extraDefaults);
  if (typeof inSettings.ColorGroup !== 'undefined') {
  		if (inSettings.ColorGroup === "Cytoplasm") {
			settings.color[0] = ["#94c83d"];
			settings.color[1] = ["#cdccca"];
		} else if (inSettings.ColorGroup === "Nucleus") {
			settings.color[0] = ["#017bc0"];
			settings.color[1] = ["#cdccca"];
		} else if (inSettings.ColorGroup === "Endomembrane system") {
			settings.color[0] = ["#f26531"];
			settings.color[1] = ["#cdccca"];
		}
	}
  
	// Inner dimension
	var w = settings.dimension.w - settings.padding.l - settings.padding.r; // inner width
  var h = settings.dimension.h - settings.padding.t - settings.padding.b; // inner height
	
	// Max y-value
	var max;
	if (typeof settings.max == 'undefined') {
		max = d3.max(data, function(dt) {
			return d3.max(dt, function(d) {
				return parseFloat(d.value);
			});
		});
	}
	else max = settings.max;
	
  // Groups scale, x axis
  var x0Scale = d3.scaleBand()
		.domain(d3.range(data[0].length))
		.range([settings.padding.l, w])
		.padding(0.2);
  // Series scale, x axis
  var x1Scale = d3.scaleBand()
		.domain(d3.range(data.length))
		.range([0, x0Scale.bandwidth()]);

  // Values scale, y axis
  var yScale = d3.scaleLinear()
		.domain([0, max])
		.range([h, 0]);
	
	var xAxis = d3.axisBottom(x0Scale)
		.tickFormat(function(d, i) { return data[0][i]['label']; });

	var yAxis = d3.axisLeft(yScale)
		.tickFormat(d3.format(settings.yTickFormat));

			
  // Visualisation selection
  var vis = d3.select($(this).get(0))
		.append("svg:svg")
		.attr("width", settings.dimension.w)
		.attr("height", settings.dimension.h)
		.attr("class", "barchart");

  // Series selection
  var series = vis.selectAll("g.series")
		.data(data)
    .enter().append("svg:g")
		.attr("class", "series") // Not strictly necessary, but helpful when inspecting the DOM
		.attr("fill", function (d, i) { return d[0]['color']? d[0]['color'] : settings.color[i]; })
		.attr("transform", function (d, i) { return "translate(" + x1Scale(i) + ")"; });

  // Groups selection
  var groups = series.selectAll("rect").data(Object); // The second dimension in the two-dimensional data array
	
	groups.enter().append("a")
		.each(function(d) { if (d.value_url) d3.select(this).attr("xlink:href", d.value_url); })
		.append("svg:rect")
		.attr("x", 0)
		.attr("y", function (d) { return yScale(d.value)+settings.padding.t ; })
		.attr("width", x1Scale.bandwidth())
		.attr("height", function (d) { return h-yScale(d.value); })
		.attr("class", "bar")
		.attr("transform", function (d, i) { return "translate(" + x0Scale(i) + ")"; })
		.attr("title", function(d) { return d.value_tooltip; });
	
	// Significance bars
	if (typeof settings.significance != 'undefined') {
		var sigBars = groups.enter().append("svg:g")
			.attr("class", "significance-bar")
			.attr("transform", function (d, i) { return "translate(" + x0Scale(i) + ", "+settings.padding.t+")"; });
		sigBars.each(function(d) {
			if (d.pval<settings.significance) {
				d3.select(this).append("text")
					.attr("x", x1Scale.bandwidth()*data.length/2)
					.attr("color", 'black')
					.text("*");
				d3.select(this).append("svg:rect")
					.attr("fill", 'black')
					.attr("width", x1Scale.bandwidth()*data.length)
					.attr("height", 1);
			}
		});
	}
	
	// X axis
	vis.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + (h+settings.padding.t) + ")")
		.call(xAxis)
		.selectAll(".tick text")
		.attr("transform", settings.xLabelTransform)
		.attr("text-anchor", settings.xLabelTransform.indexOf('rotate')!==-1? "end":"middle")
		.attr("title", function(d, i) { if (data[0][i]['label_tooltip']) return data[0][i]['label_tooltip']; })
		.each(function (d, i) {
			if (data[0][i]['label_url']) {
				var node = d3.select(this);
				var txt = node.text();
				node.text('');
				node.append('a').attr("xlink:href", data[0][i]['label_url']).text(txt);
			}
		});
			
	// X axis label
	vis.selectAll(".x.axis")
		.append("text")
		.attr("y", -6)
		.attr("x", w)
		.text(settings.xAxisLabel);
	
	// Y axis
	vis.append("g")
		.attr("class", "y axis")
		.attr('transform', 'translate(' + [settings.padding.l, settings.padding.t] + ')')
		.call(yAxis)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text(settings.yAxisLabel);
	
	// Legend
	if (settings.legend !== '') {
		
		var legend = vis.selectAll(".legend")
			.data(data)
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("rect")
			.attr("x", settings.legend.x)
			.attr("y", settings.legend.y)
			.attr("width", 18)
			.attr("height", 18)
			.style("fill", function(d, i) {return d[0]['color']? d[0]['color'] : settings.color[i]; });

		legend.append("text")
			.attr("x", settings.legend.x+settings.legend.txtX)
			.attr("y", settings.legend.y+9)
			.attr("dy", ".35em")
			.style("text-anchor", settings.legend.txtAnchor)
			.text(function(d) { return d[0].name; });
	}
	return {
		vis: vis,
		settings: settings,
		h: settings.dimension.h,
		w: settings.dimension.w,
		x0: x0Scale,
		x0Min: x0Scale.domain()[0],
		x0Max: x0Scale.domain()[1],
		x1: x1Scale,
		x1Min: x1Scale.domain()[0],
		x1Max: x1Scale.domain()[1],
		y: yScale,
		yMin: yScale.domain()[0],
		yMax: yScale.domain()[1],
		color: settings.color
	};
};
//## Stacked barchart ##
$.fn.stackedChart = function(data, inSettings) {
	var extraDefaults = {
		normalize: true,
		overlapStack: false,
	};
	var settings = addDefaultPlotSettings(inSettings, extraDefaults);

	
	// Inner dimension
	var w = settings.dimension.w - settings.padding.l - settings.padding.r; // inner width
  var h = settings.dimension.h - settings.padding.t - settings.padding.b; // inner height
	
  // Groups scale, x axis
  var xScale = d3.scaleBand()
		.range([settings.padding.l, w])
		.padding(0.2);
	
  // Values scale, y axis
  var yScale = d3.scaleLinear()
		.range([h, 0]);
	
	var color = d3.scaleOrdinal()
    .range(settings.color);
	
	var xAxis = d3.axisBottom(xScale)
		.tickSize(0)
		.tickFormat(function(d, i) { return (data[i][0]['name_label'] === undefined) ? data[i][0]['name'] : data[i][0]['name_label']; });

	var yAxis = d3.axisLeft(yScale)
		.tickSize(0)
		.tickFormat(d3.format(settings.yTickFormat));
	if (settings.yNumTicks) {
		yAxis.ticks(settings.yNumTicks);
	}

	if (settings.grid) yAxis.tickSizeInner(-w+settings.padding.l);
	if (settings.normalize) yAxis.tickFormat(d3.format(".0%"));
	
	color.domain(data[0].map(function(d, i) { return d.label; }));
	
	// Calc y-positions
	var max = 0;
	var i, d;
	for (var g=0; g<data.length; g++) {
		var y0 = 0;
		for (i=0; i<data[g].length; i++) {
			d = data[g][i];
			d.y0 = y0;
			if (settings.overlapStack) d.y1 = parseFloat(d.value);
			else d.y1 = y0 += +parseFloat(d.value);
			if (max < d.y1) max = d.y1;
		}
		if (settings.normalize) {
			for (i=0; i<data[g].length; i++) {
				d = data[g][i];
				d.y0 /= y0;
				d.y1 /= y0;
			}
		}
	}
	
	xScale.domain(data.map(function(d) { return (d[0].name_label === undefined) ? d[0].name : d[0].name_label; }));
	if (!settings.normalize) {
		var yMax = (settings.minY)? Math.max(settings.minY, max) : max;
		yScale.domain([0, yMax]);
	}
	
  // Visualisation selection
  var vis = d3.select($(this).get(0))
		.append("svg")
		.attr("width", settings.dimension.w)
		.attr("height", settings.dimension.h)
		.attr("class", "chart stackedchart")
		.append("g");
	
	// Y axis
	var yTxt = vis.append("g")
		.attr("class", "y axis")
		.attr('transform', 'translate(' + [settings.padding.l, settings.padding.t] + ')')
		.call(yAxis)
		.append("text")
		.text(settings.yAxisLabel);
		if (settings.yAxisLabelAbove) {
			yTxt
				.attr("y", -8)
				.style("text-anchor", "middle");
		}
		else {
			yTxt
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end");
		}
	
	// X axis
	vis.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + (h+settings.padding.t) + ")")
		.call(xAxis)
		.selectAll(".tick text")
		.attr("transform", settings.xLabelTransform)
		.attr("text-anchor", settings.xLabelTransform.indexOf('rotate')!==-1? "end":"middle")
		.attr("title", function(d, i) { return data[i][0]['name_tooltip']; })
		.each(function(d, i) {
			if (data[i][0]['name_url']) {
				var node = d3.select(this);
				var txt = node.text();
				node.text('');
				node.append('a').attr("xlink:href", data[i][0]['name_url']).text(txt);
			}
		});

	// X axis label
	vis.selectAll(".x.axis")
		.append("text")
		.attr("y", -6)
		.attr("x", settings.dimension.w)
		.style("text-anchor", "end")
		.text(settings.xAxisLabel);
	
	var group = vis.selectAll(".group")
		.data(data)
    .enter().append("g")
		.attr("class", "group")
		.attr("transform", function(d) { return "translate(" + xScale((d[0].name_label === undefined) ? d[0].name : d[0].name_label) + ",0)"; });

  group.selectAll("rect")
		.data(Object)
    .enter().append("a")
		.each(function(d) { if (d.value_url) d3.select(this).attr("xlink:href", d.value_url); })
		.append("rect")
		.attr("width", xScale.bandwidth())
		.attr("y", function(d) { return yScale(d.y1)+settings.padding.t; })
		.attr("height", function(d) { return yScale(d.y0) - yScale(d.y1); })
		.style("fill", function(d) { return d.color? d.color : color(d.label); })
		.attr("title", function(d) { return d.value_tooltip; })
		.on("mouseover", function(d, i) {
			var r = getHighlightColor($(this).css("fill"));
			if (typeof $(this).attr("fill-old") === "undefined") {
				$(this).attr("fill-old", $(this).css("fill"));
			}
			d3.select(this).transition().style("fill", 'rgb('+r[1]+','+r[2]+','+r[3]+')');
			
    })
    .on("mouseout", function(d, i) {
			if ($(this).attr("fill-old")) {
				d3.select(this).transition().style("fill", $(this).attr("fill-old"));
			}
    });
		
	if (settings.valueLabels) {
		group.selectAll("text")
			.data(Object)
			.enter().append("text")
			.attr("class", "valueLabel")
			.style("text-anchor", "middle")
			.attr("x", function(d, i) { return xScale.bandwidth()/2; })
			.attr("y", function(d) { return yScale(d.y1)+settings.padding.t+12; })
			.text(function(d) { return d.value; });
	}

	// Legend
	if (settings.legend !== '') {
		var legend = vis.selectAll(".legend")
			.data(data[0].reverse())
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("rect")
			.attr("x", settings.legend.x)
			.attr("y", settings.legend.y)
			.attr("width", 18)
			.attr("height", 18)
			.style("fill", function(d, i) {return d.color? d.color : color(d.label); });

		legend.append("text")
			.attr("x", settings.legend.x+settings.legend.txtX)
			.attr("y", settings.legend.y+9)
			.attr("dy", ".35em")
			.style("text-anchor", settings.legend.txtAnchor)
			.text(function(d) { return d.label; });
	}

	$(this).on('sort', function(e, order_func) {
		var x0 = xScale.domain(
			data.sort(order_func)
				.map(function(d) {
					return (d[0].name_label === undefined) ? d[0].name : d[0].name_label;
				})
		)
			.copy();

		var comp = function(a, b) {
			return x0(a[0].name) - x0(b[0].name);
		};
		vis.selectAll(".group").sort(comp);
		vis.selectAll(".x.axis.tick").sort(comp);

		var transition = vis.transition().duration(100);
		transition.selectAll(".group")
			.attr("transform", function(d) { return 'translate('+x0((d[0].name_label === undefined) ? d[0].name : d[0].name_label)+', 0)'; });
		transition.select(".x.axis")
			.call(xAxis);
			// .selectAll(".tick text")
	});

	return {
		vis: vis,
		settings: settings,
		h: h,
		w: w,
		x: xScale,
		xMin: xScale.domain()[0],
		xMax: xScale.domain()[1],
		y: yScale,
		yMin: yScale.domain()[0],
		yMax: yScale.domain()[1],
		color: settings.color
	};
};

//## LineBandplot ##
$.fn.lineBandPlot = function(data, inSettings) {
	var settings = addDefaultPlotSettings(inSettings);
	
	// Inner dimension
	var w = settings.dimension.w - settings.padding.l - settings.padding.r; // inner width
  var h = settings.dimension.h - settings.padding.t - settings.padding.b; // inner height
	
  // Groups scale, x axis
  var xScale = d3.scaleBand()
		.range([0, w])
		.padding(0)
		.domain(data[0].map(function(d) { return d.label; }));
	
  // Values scale, y axis
  var yScale = d3.scaleLinear()
		.range([h, 0]);
	
	var color = d3.scaleOrdinal()
    .range(settings.color);
	
	
	var xAxis = d3.axisBottom(xScale);
	if (settings.xTickFormat) xAxis.tickFormat(d3.format(settings.xTickFormat));
	if (settings.xTickValues) xAxis.tickValues(settings.xTickValues);
	
	var yAxis = d3.axisLeft(yScale)
		//.tickSize(6)
		.tickFormat(d3.format(settings.yTickFormat));
	if (settings.grid) yAxis.innerTickSize(-w+settings.padding.l);
	if (settings.yTicks) yAxis.ticks(settings.yTicks);
	
	color.domain(data[0].map(function(d, i) { return d.name; }));
	
	// Calc y-positions
	var max = 0;
	var legends = [];
	var i;
	for (var g=0; g<data.length; g++) {
		for (i=0; i<data[g].length; i++) {
			var d = data[g][i];
			if (max < parseFloat(d.value)) max = parseFloat(d.value);
			legends[d.name] = d;
		}
	}
	var lgnd = [];
	for (i in legends) {
		lgnd.push(legends[i]);
	}
	
	yScale.domain([0, max]);
	
  // Visualisation selection
  var vis = d3.select($(this).get(0))
		.append("svg")
		.attr("width", settings.dimension.w)
		.attr("height", settings.dimension.h)
		.attr("class", "chart scatterplot")
		.append("g")
		.attr("transform", "translate(" + settings.padding.l + "," + settings.padding.t + ")");
	
	var group = vis.selectAll(".group")
		.data(data)
    .enter().append("g")
		.attr("class", "group");

	group.append("path")
      .datum(Object)
      .attr("fill", "none")
      .style("stroke", function(d, i) { return d[0].color? d[0].color : color(d[0].name); })
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(function(d, i) { return (i+0.5)*xScale.bandwidth() })
        .y(function(d) { return yScale(d.value) })
			)
			.each(function(d) {
				d3.select(this).attr("class", 'yScaleDependent '+d[0].class);
				d3.select(this).attr("yMax", function() {
					var max = 0;
					for (i=0; i<d.length; i++) {
						var dv = d[i];
						if (max < parseFloat(dv.value)) max = parseFloat(dv.value);
					}
					return max;
				});
			})
	
	var markerSize = settings.markerSize? settings.markerSize : 4;
  if (settings.showMarkers) {
		group.selectAll("rect")
			.data(Object)
			.enter().append("a")
			.each(function(d) { if (d.value_url) d3.select(this).attr("xlink:href", d.value_url); })
			.append("rect")
			.attr("y", function(d) { return yScale(d.value)-markerSize/2; })
			.attr("x", function(d, i) { return (i+0.5)*xScale.bandwidth()-markerSize/2; })
			.attr("width", markerSize)
			.attr("height", markerSize)
			.style("fill", 'transparent')
			.style("stroke", function(d) { return d.color? d.color : color(d.name); })
			.attr("title", function(d) { return d.value_tooltip; })
			.on("mouseover", function(d, i) {
				d3.select(this).transition().style("fill", $(this).css("stroke"));
			})
			.on("mouseout", function(d, i) {
				d3.select(this).transition().style("fill", 'transparent');
			});
	}
		
	// Y axis
	vis.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text(settings.yAxisLabel);
	
	// X axis
	vis.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + h + ")")
		.call(xAxis)
		.selectAll(".tick text")
		.attr("transform", settings.xLabelTransform)
		.style("text-anchor", "end")
		.style("cursor", function(d, i) { return data[0][i]['label_url']? "pointer" : "auto"; })
		.on('click', function(d, i) { if (data[0][i]['label_url']) window.location.href = data[i][0]['label_url']; } )
		.attr("title", function(d, i) { return data[0][i]['label_tooltip']; });
			
	// X axis label
	vis.selectAll(".x.axis")
		.append("text")
		.attr("y", -6)
		.attr("x", settings.dimension.w)
		.style("text-anchor", "end")
		.text(settings.xAxisLabel);
		
	if (settings.valueLabels) {
		group.selectAll("text")
			.data(Object)
			.enter().append("text")
			.attr("class", "valueLabel")
			.style("text-anchor", "middle")
			.attr("x", function(d, i) { return (i+1)*xScale.bandwidth(); })
			.attr("y", function(d) { return yScale(d.value)-markerSize*1; })
			.text(function(d) { return d.value; });
	}

	// Legend
	if (settings.legend !== '') {
		var legend = vis.selectAll(".legend")
			.data(lgnd.reverse())
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("rect")
			.attr("x", settings.legend.x)
			.attr("y", settings.legend.y)
			.attr("width", 18)
			.attr("height", 18)
			.style("fill", function(d, i) {return d.color? d.color : color(d.name); });

		legend.append("text")
			.attr("x", settings.legend.x+settings.legend.txtX)
			.attr("y", settings.legend.y+9)
			.attr("dy", ".35em")
			.style("text-anchor", settings.legend.txtAnchor)
			.text(function(d) { return d.name; });
	}

	var plot = {
		vis: vis,
		settings: settings,
		h: settings.dimension.h,
		w: settings.dimension.w,
		x: xScale,
		xAxis: xAxis,
		xMin: xScale.domain()[0],
		xMax: xScale.domain()[1],
		y: yScale,
		yAxis: yAxis,
		yMin: yScale.domain()[0],
		yMax: yScale.domain()[1],
		color: settings.color
	};
	
	
	$(this).on('rescale', function(e, scale) {
		var plot = $(this).data('plot');
		if (scale === 'ylin') {
			yScale = plot.y = d3.scaleLinear()
				.domain([plot.yMin, plot.yMax])
				.range([h, 0]);
			yAxis = d3.axisLeft(yScale)
				.tickFormat(d3.format(".2s"));
			vis.selectAll('.y.axis .label').text(function() { return d3.select(this).text().replace('log ', ''); });
		}
		else if (scale === 'ycurmax') {
			var yCurMax = 0;
			$(this).find('path:visible').each(function() {
				if (yCurMax < parseFloat($(this).attr('yMax'))) yCurMax = parseFloat($(this).attr('yMax'));
			});
			yScale = plot.y = d3.scaleLinear()
				.domain([plot.yMin, yCurMax])
				.range([h, 0]);
			yAxis = d3.axisLeft(yScale)
				.tickFormat(d3.format(".2s"));
			vis.selectAll('.y.axis .label').text(function() { return d3.select(this).text().replace('log ', ''); });
		}
		else return;
		
		var t = d3.transition().duration(settings.transitionTime);
		vis.selectAll(".yScaleDependent")
			.transition(t)
			.attr('transform', function() {
				var node = d3.select(this);
				node.attr("d", d3.line()
					.x(function(d, i) { return (i+0.5)*xScale.bandwidth() })
					.y(function(d) { return yScale(d.value) })
				);
			});
		vis.selectAll(".axis.x")
			.transition(t)
			.call(xAxis);
		vis.selectAll(".axis.y")
			.transition(t)
			.call(yAxis);
			
		$(this).data('plot', plot);
  });
	$(this).data('plot', plot);
	return plot;
};

//## ScatterBandplot ##
$.fn.scatterBandPlot = function(data, inSettings) {
	var settings = addDefaultPlotSettings(inSettings);
	
	// Inner dimension
	var w = settings.dimension.w - settings.padding.l - settings.padding.r; // inner width
  var h = settings.dimension.h - settings.padding.t - settings.padding.b; // inner height
	
  // Groups scale, x axis
  var xScale = d3.scaleBand()
		.range([settings.padding.l, w])
		.padding(0.2);
	
  // Values scale, y axis
  var yScale = d3.scaleLinear()
		.range([h, 0]);
	
	var color = d3.scaleOrdinal()
    .range(settings.color);
	
	var xAxis = d3.axisBottom(xScale)
		//.tickSize(0)
		.tickFormat(function(d, i) { return data[i][0]['name']; });

	var yAxis = d3.axisLeft(yScale)
		//.tickSize(6)
		.tickFormat(d3.format(settings.yTickFormat));
	if (settings.grid) yAxis.innerTickSize(-w+settings.padding.l);
	
	color.domain(data[0].map(function(d, i) { return d.label; }));
	
	// Calc y-positions
	var max = 0;
	var legends = [];
	var i;
	for (var g=0; g<data.length; g++) {
		for (i=0; i<data[g].length; i++) {
			var d = data[g][i];
			if (max < parseFloat(d.value)) max = parseFloat(d.value);
			legends[d.label] = d;
		}
	}
	var lgnd = [];
	for (i in legends) {
		lgnd.push(legends[i]);
	}
	
	xScale.domain(data.map(function(d) { return d[0].name; }));
	yScale.domain([0, max]);
	
  // Visualisation selection
  var vis = d3.select($(this).get(0))
		.append("svg")
		.attr("width", settings.dimension.w)
		.attr("height", settings.dimension.h)
		.attr("class", "chart scatterplot")
		.append("g");
	
	var group = vis.selectAll(".group")
		.data(data)
    .enter().append("g")
		.attr("class", "group")
		.attr("transform", function(d) { return "translate(" + xScale(d[0].name) + ",0)"; });

  group.selectAll("rect")
		.data(Object)
    .enter().append("a")
		.each(function(d) { if (d.value_url) d3.select(this).attr("xlink:href", d.value_url); })
		.append("rect")
		.attr("y", function(d) { return yScale(d.value)+settings.padding.t-3; })
		.attr("x", 4)
		.attr("width", 6)
		.attr("height", 6)
		.style("fill", 'transparent')
		.style("stroke", function(d) { return d.color? d.color : color(d.label); })
		.attr("title", function(d) { return d.value_tooltip; })
		.on("mouseover", function(d, i) {
			d3.select(this).transition().style("fill", $(this).css("stroke"));
    })
    .on("mouseout", function(d, i) {
			d3.select(this).transition().style("fill", 'transparent');
    });
		
	// Y axis
	vis.append("g")
		.attr("class", "y axis")
		.attr('transform', 'translate(' + [settings.padding.l, settings.padding.t] + ')')
		.call(yAxis)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text(settings.yAxisLabel);
	
	// X axis
	vis.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + (h+settings.padding.t) + ")")
		.call(xAxis)
		.selectAll(".tick text")
		.attr("transform", settings.xLabelTransform)
		.style("text-anchor", "end")
		.style("cursor", function(d, i) { return data[i][0]['name_url']? "pointer" : "auto"; })
		.on('click', function(d, i) { if (data[i][0]['name_url']) window.location.href = data[i][0]['name_url']; } )
		.attr("title", function(d, i) { return data[i][0]['name_tooltip']; });
			
	// X axis label
	vis.selectAll(".x.axis")
		.append("text")
		.attr("y", -6)
		.attr("x", settings.dimension.w)
		.style("text-anchor", "end")
		.text(settings.xAxisLabel);
		
	if (settings.valueLabels) {
		group.selectAll("text")
			.data(Object)
			.enter().append("text")
			.attr("class", "valueLabel")
			.style("text-anchor", "middle")
			.attr("x", function(d, i) { return xScale.bandwidth()/2; })
			.attr("y", function(d) { return yScale(d.value)+settings.padding.t+12; })
			.text(function(d) { return d.value; });
	}

	// Legend
	if (settings.legend !== '') {
		var legend = vis.selectAll(".legend")
			.data(lgnd.reverse())
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("rect")
			.attr("x", settings.legend.x)
			.attr("y", settings.legend.y)
			.attr("width", 18)
			.attr("height", 18)
			.style("fill", function(d, i) {return d.color? d.color : settings.color[i]; });

		legend.append("text")
			.attr("x", settings.legend.x+settings.legend.txtX)
			.attr("y", settings.legend.y+9)
			.attr("dy", ".35em")
			.style("text-anchor", settings.legend.txtAnchor)
			.text(function(d) { return d.label; });
	}

	return {
		vis: vis,
		settings: settings,
		h: settings.dimension.h,
		w: settings.dimension.w,
		x: xScale,
		xMin: xScale.domain()[0],
		xMax: xScale.domain()[1],
		y: yScale,
		yMin: yScale.domain()[0],
		yMax: yScale.domain()[1],
		color: settings.color
	};
};

//## ScatterPlot ##
$.fn.scatterPlot = function(data, inSettings) {
	var plot = {};
	var extraDefaults = {
		xMin: false,
		xMax: false,
		yMin: false,
		yMax: false,
		xTickFormat: ".2s",
		xNumMaxTicks: 10,
		xNumMinTicks: 4,
		yNumMaxTicks: 10,
		yNumMinTicks: 4,
		transitionTime: 1000,
		origoAxis: false,
		objectSize: 15,
	};
	var settings = addDefaultPlotSettings(inSettings, extraDefaults);
	plot.settings = settings;
	
	// Inner dimension
	var w = plot.w = settings.dimension.w - settings.padding.l - settings.padding.r; // inner width
  var h = plot.h = settings.dimension.h - settings.padding.t - settings.padding.b; // inner height
	
	var xMin = Infinity;
	var xMax = -Infinity;
	var yMin = Infinity;
	var yMax = -Infinity;
	for (var i in data) {
		if (!data.hasOwnProperty(i)) {
			continue;
		}
		for (var j in data[i].data) {
			if (!data[i].data.hasOwnProperty(j)) {
				continue;
			}
			xMin = settings.xMin===false? Math.min(xMin, data[i].data[j].x) : settings.xMin;
			xMax = settings.xMax===false? Math.max(xMax, data[i].data[j].x) : settings.xMax;
			yMin = settings.yMin===false? Math.min(yMin, data[i].data[j].y) : settings.yMin;
			yMax = settings.yMax===false? Math.max(yMax, data[i].data[j].y) : settings.yMax;
		}
	}
	//plot.data = data; 
	plot.xMin = xMin; plot.xMax = xMax; plot.yMin = yMin; plot.yMax = yMax;
	
	var color = plot.color = d3.scaleOrdinal()
    .range(settings.color)
		.domain(d3.map(data, function(d, i) { return i; }));
	
  // X axis
  var xScale = plot.x = d3.scaleLinear()
		.domain([xMin, xMax])
		.range([0, w]);
	
  // Y axis
  var yScale = plot.y = d3.scaleLinear()
		.domain([yMin, yMax])
		.range([h, 0]);

	var xAxis = d3.axisBottom(xScale)
		.tickFormat(d3.format(settings.xTickFormat))
		.ticks(Math.min(Math.max(Math.ceil(xMax), settings.xNumMinTicks), settings.xNumMaxTicks));

	var yAxis = d3.axisLeft(yScale)
		.tickFormat(d3.format(settings.yTickFormat))
		.ticks(Math.min(Math.max(Math.ceil(yMax), settings.yNumMinTicks), settings.yNumMaxTicks));
	if (settings.grid) yAxis.tickSizeInner(-w);
	
  // Visualisation selection
  var vis = plot.vis = d3.select($(this).get(0))
		.append("svg")
		.attr("width", settings.dimension.w)
		.attr("height", settings.dimension.h)
		.attr("class", "chart scatterplot")
		.append("g")
		.attr("transform", "translate(" + settings.padding.l + "," + settings.padding.t + ")");
	
	// Plot area background
	vis.append("rect")
		.attr("class", "plotBG")
		.attr("width", xScale(xMax))
		.attr("height", yScale(0));
	
	var group = vis.selectAll(".group")
		.data(data)
    .enter().append("g")
		.attr("class", function(d, i) { return "group group"+i; })
		.attr("name", function(d, i) { return "group"+i; })
		.style("fill", function(d, i) { return d.color? d.color : color(i); })
		.each(function(d) {
			if (d.data) {
				d3.select(this).selectAll('.dot')
					.data(d.data)
					.enter()
					.append("a")
					.attr("class", function(d) { return d.class?"dot "+d.class:"dot"; })
					.attr('transform', function(d) { return 'translate(' + [xScale(d.x), yScale(d.y)] + ')'; })
					.each(function(d) {
						if (d.url) d3.select(this).attr("xlink:href", d.url);
						if (d.tooltip) d3.select(this).attr("title", d.tooltip);
						if (settings.valueLabels) d3.select(this).append('text').text(d.x+','+d.y);
						if (settings.objectLabels) d3.select(this).append('text').text(d.label).style("text-anchor", "middle").attr('y', -5);
						if (d.color) d3.select(this).style("fill", d.color);
					})
					.append("path")
					.attr('d', d3.symbol().size(d.size||settings.objectSize).type(getD3Symbol(d.symbol)));
			}
		});
		
	// Add larger tooltip area behind dot
	group.selectAll("a")
		.append("circle")
		.attr("r", 4)
		.style("fill", 'transparent');

	
	// Y axis
	if (settings.yAxisLabel) {
		vis.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 10)
			.attr("x", -2)
			.attr("class", "label")
			.style("text-anchor", "end")
			.text(settings.yAxisLabel);
		if (settings.origoAxis) {
			vis.selectAll('g.y.axis')
				.attr("transform", "translate(" + xScale(0) + ", 0)");
		}
	}
	
	// X axis
	if (settings.xAxisLabel) {
		vis.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + h + ")")
			.call(xAxis)
			.append("text")
			.attr("y",-2)
			.attr("x", w-2)
			.attr("class", "label")
			.style("text-anchor", "end")
			.text(settings.xAxisLabel);
		if (settings.origoAxis) {
			vis.selectAll('g.x.axis')
				.attr("transform", "translate(0," + yScale(0) + ")");
		}
	}
	
	// Legend
	if (settings.legend !== '') {
		var legend = vis.selectAll(".legend")
			.data(data)
			.enter().append("g")
			.attr("class", function(d, i) { return "legend legend"+i; })
			.attr("name", function(d, i) { return "legend"+i; })
			.attr("transform", function(d, i) { return "translate("+settings.legend.x+"," + (settings.legend.y + i * (settings.legend.size+2)) + ")"; });

		legend.append("rect")
			.attr("width", settings.legend.size)
			.attr("height", settings.legend.size)
			.style("fill", function(d, i) { return d.color? d.color : color(i); });

		legend.append("text")
			.attr("x", settings.legend.size+2)
			.attr("y", settings.legend.size/2)
			.attr("dy", ".35em")
			.text(function(d) { return d.name; });
	}
	
	$(this).on('rescale', function(e, scale) {
		var plot = $(this).data('plot');
		if (scale === 'xlog') {
			xScale = plot.x = d3.scaleLog()
				.domain([Math.max(0.0001, xMin), xMax])
				.range([0, w]);
			xAxis = d3.axisBottom(xScale)
				.tickValues([1e-3,1e-2,1e-1,1e0,1e1,1e2,1e3].filter(function(d) {
					return (d < xMax);
				}));
			vis.selectAll('.x.axis .label').text(function() { return 'log '+d3.select(this).text(); });
		}
		else if (scale === 'xlin') {
			xScale = plot.x = d3.scaleLinear()
				.domain([xMin, xMax])
				.range([0, w]);
			xAxis = d3.axisBottom(xScale)
				.tickFormat(d3.format(".2s"));
			vis.selectAll('.x.axis .label').text(function() { return d3.select(this).text().replace('log ', ''); });
		}
		else if (scale === 'ylog') {
			yScale = plot.y = d3.scaleLog()
				.domain([Math.max(0.0001, yMin), yMax])
				.range([h, 0]);
			yAxis = d3.axisLeft(yScale)
				.tickValues([1e-3,1e-2,1e-1,1e0,1e1,1e2,1e3].filter(function(d) {
					return (d < yMax);
				}));
			vis.selectAll('.y.axis .label').text(function() { return 'log '+d3.select(this).text(); });
		}
		else if (scale === 'ylin') {
			yScale = plot.y = d3.scaleLinear()
				.domain([yMin, yMax])
				.range([h, 0]);
			yAxis = d3.axisLeft(yScale)
				.tickFormat(d3.format(".2s"));
			vis.selectAll('.y.axis .label').text(function() { return d3.select(this).text().replace('log ', ''); });
		}
		else return;
		
		var t = d3.transition().duration(settings.transitionTime);
		group.each(function(d) {
			d3.select(this).selectAll('.dot')
				.data(d.data)
				.transition(t)
				.attr('transform', function(d) { var xp = xScale(d.x); var yp = yScale(d.y); return (xp==-Infinity || yp==-Infinity)? 'translate(0,'+h+')' : 'translate(' + [xp, yp] + ')'; });
		});
		vis.selectAll(".xScaleDependent")
			.transition(t)
			.attr('transform', function() {
				var node = d3.select(this);
				if (node.classed('yScaleDependent')) return 'translate('+xScale(node.attr('xVal'))+', '+yScale(node.attr('yVal'))+')';
				else return 'translate('+xScale(node.attr('xVal'))+')';
			});
		vis.selectAll(".axis.x")
			.transition(t)
			.call(xAxis);
		vis.selectAll(".axis.y")
			.transition(t)
			.call(yAxis);
			
		$(this).data('plot', plot);
  });
	$(this).data('plot', plot);
	return plot;
};

//## VennDiagram ##
$.fn.vennDiagram = function(data, inSettings) {
	var plot = {};
	var settings = addDefaultPlotSettings(inSettings);
  plot.settings = settings;
	
	// Inner dimension
	var w = settings.dimension.w - settings.padding.l - settings.padding.r; // inner width
  var h = settings.dimension.h - settings.padding.t - settings.padding.b; // inner height
	
	//var vis = plot.vis = d3.select($(this).get(0)).datum(d).call(chart);
  // Visualisation selection
  var vis = plot.vis = d3.select($(this).get(0))
		.append("svg")
		.attr("width", settings.dimension.w)
		.attr("height", settings.dimension.h)
		.attr("class", "chart venn")
		.append("g")
		.attr("transform", "translate(" + settings.padding.l + "," + settings.padding.t + ")");
	var chart = venn.VennDiagram().width(w).height(h);
	vis.datum(data).call(chart);
	
	// circle style
	vis.selectAll(".venn-circle path")
		.style("fill", function(d, i) { return d.color? d.color : settings.color[i]; })
		.style("fill-opacity", 0.5)
		.attr("title", function(d, i) { return d.tooltip? d.tooltip : ""; });
		
	// Links
	vis.selectAll("text.label")
		.attr("style", "")
		.each(function(d, i) {
			if (d.url) {
				var t = d3.select(this).selectAll('tspan').text();
				d3.select(this)
					.append('a')
					.attr("xlink:href", d.url)
					.text(t);
				d3.select(this).selectAll('tspan').remove();
			}
			if (d.tooltip) {
				d3.select(this)
					.attr('title', d.tooltip);
			}
		});
	
	//return plot;
	
	// Legend
	if (settings.legend !== '') {
		var legend = vis.selectAll(".legend")
			.data(data)
			.enter()
			.filter(function(d) { return (d.sets.length == 1); })
			.append("g")
			.attr("class", function(d, i) { return "legend legend"+i; })
			.attr("name", function(d, i) { return "legend"+i; })
			.attr("transform", function(d, i) { return "translate(0," + i * (settings.legend.size+2) + ")"; });

		legend.append("rect")
			.attr("x", settings.legend.x)
			.attr("y", settings.legend.y)
			.attr("width", settings.legend.size)
			.attr("height", settings.legend.size)
			.style("fill", function(d, i) { return d.color? d.color : settings.color[i]; })
			.style("fill-opacity", 0.5);

		legend.append("text")
			.attr("x", settings.legend.x+settings.legend.size+2)
			.attr("y", settings.legend.y+settings.legend.size/2)
			.attr("dy", ".35em")
			.text(function(d) { return d.title; });
	}
	return plot;
};

//## pieChart ##
$.fn.pieChart = function(data, inSettings) {
	var plot = {};
	var extraDefaults = {
		valueLabels: true,
		labelRadiusOffset: 10,
		labelOffset: 3,
		labelSpacing: 10,
	};
	var settings = addDefaultPlotSettings(inSettings, extraDefaults);
	plot.settings = settings;
	
	// Inner dimension
	var w = settings.dimension.w - settings.padding.l - settings.padding.r; // inner width
  var h = settings.dimension.h - settings.padding.t - settings.padding.b; // inner height
	var radius = (Math.min(h, w) / 2 );
	
	// Piechart
	var arc = d3.arc()
		.outerRadius(radius)
		.innerRadius(0);

	var pie = d3.pie()
		.sort(null)
		.value(function(d) { return d.value; });

	var vis = plot.vis = d3.select($(this).get(0))
		.append("svg")
		.attr("width", settings.dimension.w)
		.attr("height", settings.dimension.h)
		.attr("class", "chart pie")
		.append("g")
		.attr("transform", "translate(" + (radius+settings.padding.l) + "," + (radius+settings.padding.t) + ")");
	
	//make sure "value" is a number:
	data.forEach(function(d) {
		d.value = +d.value;
	});
	var piedata = pie(data);
	
	var pieg = vis.selectAll()
		.data(piedata)
		.enter()
		.append("g")
			.attr("class", "sector")
			.attr("title", function(d) { return d.data.tooltip? d.data.tooltip : ''; })
			.on("mouseover", function(d, i) {
				var p = d3.select(this).selectAll('path');
				var r = getHighlightColor(p.style('fill'));
				if (!p.attr("fill-old")) {
					p.attr("fill-old", p.style("fill"));
				}
				p.transition().style("fill", 'rgb('+r[1]+','+r[2]+','+r[3]+')');
			})
			.on("mouseout", function(d, i) {
				var p = d3.select(this).selectAll('path');
				if (p.attr("fill-old")) {
					p.transition().style("fill", p.attr("fill-old"));
				}
			});
	
	var glink = pieg
		.append("a").each(function(d, i) {
			if (d.data.url) d3.select(this).attr("xlink:href", d.data.url);
			d3.select(this)
				.append("path")
				.attr("d", arc)
				.style("fill", d.data.color? d.data.color : settings.color[i])
				.style("stroke", "black")
				.style("stroke-width", "0.5");
			if (settings.valueLabels) {
				var c = arc.centroid(d),
						h = Math.sqrt(c[0]*c[0] + c[1]*c[1]),
						modifier = Math.round((d.data.value.toString().length)*0.5),
						midAngle = Math.atan2(c[1], c[0]),
						x = Math.cos(midAngle) * (radius+settings.labelRadiusOffset);
				d3.select(this)
					.append("text")
						.text(d.data.value)
						.attr('x', x + (settings.labelOffset * ((x > 0) ? 1 : -1)))
						.attr('y', Math.sin(midAngle) * (radius+settings.labelRadiusOffset))
						.attr('text-anchor', (x > 0) ? "start" : "end")
						.attr('alignment-baseline', "middle")
						.attr('class', 'label-text');
				d3.select(this)
					.append("line")
						.attr('x1', Math.cos(midAngle) * radius)
						.attr('y1', Math.sin(midAngle) * radius)
						.attr('x2', Math.cos(midAngle) * (radius+settings.labelRadiusOffset))
						.attr('y2', Math.sin(midAngle) * (radius+settings.labelRadiusOffset))
						.attr("stroke", "black")
						.attr("stroke-width", "0.7")
						.attr('class', "label-line");
			}
		});

	var textLabels = glink.select('text');
	var labelLines = glink.select('line');
	var alpha = 0.5;
	function relaxPieLabels() {
		var again = false;
		textLabels.each(function (d, i) {
			var a = this;
			var da = d3.select(a);
			var y1 = da.attr("y");
			textLabels.each(function (d, j) {
				var b = this;
				// a & b are the same element and don't collide.
				if (a == b) return;
				var db = d3.select(b);
				// a & b are on opposite sides of the chart and don't collide
				if (da.attr("text-anchor") != db.attr("text-anchor")) return;
				// Now let's calculate the distance between these elements.
				var y2 = db.attr("y");
				var deltaY = y1 - y2;
				// Our spacing is greater than our specified spacing, so they don't collide.
				if (Math.abs(deltaY) > settings.labelSpacing) return;
				// If the labels collide, we'll push each of the two labels up and down a little bit.
				again = true;
				var sign = deltaY > 0 ? 1 : -1;
				var adjust = sign * alpha;
				da.attr("y",+y1 + adjust);
				db.attr("y",+y2 - adjust);
			});
		});
		// Adjust lines so that they follow the labels.
		if (again) {
			labelLines.attr("y2",function(d,i) {
				return d3.select(textLabels.nodes()[i]).attr("y");
			});
			setTimeout(relaxPieLabels, 20);
		}
	}
	relaxPieLabels();
	
	// Legend
	if (settings.legend !== '') {
		var legend = vis.selectAll(".legend")
			.data(data)
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(0," + i * (settings.legend.size+2) + ")"; });

		var links = legend.append("a")
			.attr("href", function(d) {return d.url ? d.url : "";})
			.attr("xlink:href", function(d) {return d.url ? d.url : "";});
		links.append("rect")
			.attr("x", settings.legend.x-radius)
			.attr("y", settings.legend.y-radius)
			.attr("width", settings.legend.size)
			.attr("height", settings.legend.size)
			.style("fill", function(d, i) {return d.color? d.color : settings.color[i]; });

		links.append("text")
			.attr("x", settings.legend.x+settings.legend.txtX-radius)
			.attr("y", settings.legend.y+(settings.legend.size/2)-radius)
			.attr("dy", ".35em")
			.style("text-anchor", settings.legend.txtAnchor)
			.text(function(d) { return d.label; });
	}

	return {
		vis: vis,
		settings: settings,
		h: settings.dimension.h,
		w: settings.dimension.w,
		color: settings.color
	};
};


//## kaplanMeierPlot ##
$.fn.kaplanMeierPlot = function(d, inSettings) {
	var plot = {};
	var extraDefaults = {
		showCensor: 6
	};
	var settings = addDefaultPlotSettings(inSettings, extraDefaults);
	plot.settings = settings;
	// Inner dimension
	var w = plot.w = settings.dimension.w - settings.padding.l - settings.padding.r; // inner width
  var h = plot.h = settings.dimension.h - settings.padding.t - settings.padding.b; // inner height
	
	var data = d.data;
	var groups = d.groups;
	var xMin = 0;
	var yMin = 0;
	var yMax = 1;
	
	// Y axis
  var yScale = plot.y = d3.scaleLinear()
		.domain([yMin, yMax])
		.range([h, 0]);
	
	plot.fixData = function(data, y, showCensor) {
		var xMax = 0;
		var censorY = y.invert(h-showCensor/2);
		var last_d;
		for (var i=0; i<data.length; i++) {
			last_d = {
				t: 0,
				e: false,
				s: 1,
				n: null,
				d: 0,
				rate: null
			};
			for (var j=0; j<data[i].length; j++) {
				var d = data[i][j];
				var jp = 0;
				xMax = Math.max(xMax, d.t);
				if (j === 0) {
					last_d.n = d.n;
					// Is this Object.assign actually necessary here?
					var ld = Object.assign({}, last_d);
					data[i].splice(j, 0, ld);
					j++;
				}
				// Vertical steps
				if (last_d && last_d.t != d.t && last_d.s != d.s) {
					var nd = Object.assign({}, last_d);
					nd.t = d.t;
					nd.d = 1;
					data[i].splice(j, 0, nd);
					jp++;
				}
				// Censors
				if (showCensor && d.d == 0) {
					var cd1 = Object.assign({}, d);
					cd1.s += censorY;
					data[i].splice(j+1, 0, cd1);
					var cd2 = Object.assign({}, d);
					cd2.s -= censorY;
					data[i].splice(j+2, 0, cd2);
					var d2 = Object.assign({}, d);
					data[i].splice(j+3, 0, d2);
					jp += 3;
				}
				j += jp;
				last_d = d;
			}
		}
		return xMax;
	};
	var xMax = plot.fixData(data, yScale, settings.showCensor);
  
	// X axis
  var xScale = plot.x = d3.scaleLinear()
		.domain([xMin, xMax]) 
		.range([0, w]);
	
	var ticks = [];
	for (var i=0; i<=xMax; i++) {
		ticks.push(i);
	}
	var xAxis = plot.xAxis = d3.axisBottom(xScale)
		.tickValues(ticks)
		.tickFormat(function(days) {
			return d3.format("2.0f")(days);
		});

	var yAxis = plot.yAxis = d3.axisLeft(yScale);
		//.tickFormat(d3.format(".2s"));
	if (settings.grid) yAxis.tickSizeInner(-w);
	if (settings.noTicks) {
		yAxis.tickSize(0);
		xAxis.tickSize(0);
	}

	var line = plot.line = d3.line()
		.x(function(d) { return xScale(d.t); })
		.y(function(d) { return yScale(d.s); });
	
  // Visualisation selection
  var vis = plot.vis = d3.select($(this).get(0))
		.append("svg")
		.attr("width", settings.dimension.w)
		.attr("height", settings.dimension.h)
		.attr("class", "chart kaplanplot")
		.append("g")
		.attr("transform", "translate(" + settings.padding.l + "," + settings.padding.t + ")");
	
	// Plot area background
	vis.append("rect")
		.attr("class", "plotBG")
		.attr("width", xScale(xMax))
		.attr("height", yScale(yMin));
	
	var group = vis.selectAll(".group")
		.data(data)
    .enter()
		.append("g") 
		.attr("class", function(d, i) { return "group group"+i; })
		.attr("name", function(d, i) { return "group"+i; })
		.style("fill", "transparent");
	group.append("path")
		.attr('d', function(d) { return line(d); });
	
	// Y axis
	vis.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
		.attr("transform", "translate(10, "+(h-2)+") rotate(-90)")
		.style("text-anchor", "start")
		.text(settings.yAxisLabel);
	
	// X axis
	vis.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + h + ")")
		.call(xAxis)
		.append("text")
		.attr("y",-2)
		.attr("x", w)
		.style("text-anchor", "end")
		.text(settings.xAxisLabel);
	
	// Legend
	if (settings.legend !== '') {
		var legend = vis.selectAll(".legend")
			.data(groups)
			.enter().append("g")
			.attr("class", function(d, i) { return "legend legend"+i; })
			.attr("name", function(d, i) { return "legend"+i; })
			.attr("transform", function(d, i) { return "translate("+settings.legend.x+"," + (settings.legend.y + i * (settings.legend.size+2)) + ")"; });

		legend.append("rect")
			.attr("width", settings.legend.size)
			.attr("height", settings.legend.size);
		
		legend.append("text")
			.attr("x", settings.legend.size+2)
			.attr("y", settings.legend.size/2)
			.attr("dy", ".35em")
			.text(function(d, i) { return d.name; });
	}
	return plot;
};

//## Boxplot ##
$.fn.boxPlot = function(d_in, inSettings) {
	var extraDefaults = {
		xLabelTransform: 'translate(0,5)',
		yAxisFormat: '.2s',
		boxLabels: true,
		showOutliers: true,
		xPadding: 0.4,
		yMin: false,
		yMax: false,
		yAxisLabelPos: "insideTop",
		medianTooltip: true,
		medianUnitTooltip: true,
		samplesTooltip: true,
		outlierFormat: '.1f'
	};
	var settings = addDefaultPlotSettings(inSettings, extraDefaults);

	var width = settings.dimension.w - settings.padding.l - settings.padding.r;
	var height = settings.dimension.h - settings.padding.t - settings.padding.b;
	
	var data = [];
	var c = 0;
	for (var i in d_in) {
		if (!d_in.hasOwnProperty(i)) {
			continue;
		}
		data[c] = [];
		data[c][1] = d_in[i].data;
		data[c][0] = d_in[i];
		data[c][0].name = i;
		data[c][0].url = (d_in[i].url === undefined) ? '' : d_in[i].url;
		data[c][0].name_label = (d_in[i].name_label === undefined) ? i : d_in[i].name_label; 
		c++;
	}
	
	var chart = d3.box()
		.whiskers(iqr(1.5))
		.height(height)	
		.showLabels(settings.boxLabels)
		.showOutliers(settings.showOutliers)
		.tickFormat(d3.format(settings.outlierFormat))
		;
	if (settings.yMin !== false) {
		chart.minVal(settings.yMin);
	}
	if (settings.yMax !== false) {
		chart.maxVal(settings.yMax);
	}
	
	var svg = d3.select($(this).get(0)).append("svg")
		.attr("width", settings.dimension.w)
		.attr("height", settings.dimension.h)
		.attr("class", "boxplot")    
		.append("g")
		.attr("transform", "translate(" + settings.padding.l + "," + settings.padding.t + ")");
	
	// the x-axis
	var xScale = d3.scaleBand()
		.domain(data.map(function(d) { return d[0].name_label; }))
		.range([0, width])
		.padding(settings.xPadding); 		

	var xAxis = d3.axisBottom(xScale)
		.tickSize(0);

	// draw the boxplots
	var tooltips = [];
	svg.selectAll(".boxplot")
		.data(data)
		.enter().append("g")
		.attr("class", "group")
		.attr("transform", function(d) { return "translate(" +  xScale(d[0].name_label) + ")"; } )
		.append('a')
		.call(chart.width(xScale.bandwidth()))
		.each(function(d, i) {
			var tooltip = d[0].tooltip? d[0].tooltip : d[0].name;
			if (settings.medianTooltip) tooltip += '<br>Median: '+Math.round(d['quartileData'][1]*10)/10;
			if (settings.medianUnitTooltip) tooltip += ' '+settings.yAxisLabel;
			if (settings.samplesTooltip) tooltip += '<br>Samples: '+d[1].length;
			d3.select(this)
				.attr("title", tooltip)
				.attr("xlink:href", function(d) { return d[0].url; })
				.attr("class", function(d) { return d[0].clss; });
			if (d[0].color) {
				d3.select(this).selectAll('rect').style('fill', d[0].color);
			}
			tooltips[i] = tooltip;
		});
		
	
	// the y-axis
	var y = d3.scaleLinear()
		.domain([
			chart.minVal(),
			chart.maxVal()
		])
		.range([height, 0]);
	var yAxis;
	if (settings.yAxisFormat === 'auto') {
		yAxis = d3.axisLeft(y)
			.scale(y);
	} else {
		yAxis = d3.axisLeft(y)
			.tickFormat(d3.format(settings.yAxisFormat));
	}
	
	// Plot area background
	svg.insert("rect", ":first-child")
		.attr("class", "plotBG")
		.attr("width", xScale.step() * (data.length + xScale.paddingOuter()))
		.attr("height", y(settings.yMin!==false? settings.yMin : chart.minVal()));
	
	// draw y axis
	var yAxisDrawn = svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);

	// draw y axis Label
	var textTransform = "rotate(-90)";
	var textAnchor = "end";
	var textPosX = 0;
	var textPosY = 10;
	if (settings.yAxisLabelPos === "outsideMiddle") {
		// Get the middle point of the axis from the range of the scale  
		var yAxisRange = yAxis.scale().range();
		textPosX = Math.abs(yAxisRange[0]-yAxisRange[1])/2 + Math.min(yAxisRange[0], yAxisRange[1]);

		textTransform = "translate("+yAxisRange[1]+","+yAxisRange[0]+") " + textTransform;
		textAnchor = "middle";
		// Align the label outside the tick labels based on the tick labels bounding boxes and add some extra padding.
		textPosY = -10 - Math.ceil(d3.max(yAxisDrawn.selectAll("g.tick").nodes(), function(item) {return item.getBBox().width;}));
	}
	var yAxisLabel = yAxisDrawn.append("text")
		.attr("transform", textTransform)
		.attr("y", textPosY)
		.attr("x", textPosX)
		.style("text-anchor", textAnchor);
	if (settings.yAxisLabel.indexOf("\n") !== -1) {
		var yLabels = settings.yAxisLabel.split("\n");
		var dy = -1 * (yLabels.length-1);
		for (var idx in yLabels) {
			yAxisLabel.append("tspan")
				.attr("x", textPosX)
				.attr("dy", dy+"em")
				.text(yLabels[idx]);
			dy = 1.2;
		}
	} else {
		yAxisLabel.text(settings.yAxisLabel);
	}

	// draw x axis
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.append("text")
		.attr("x", width)
		.attr("y",  -2)
		.style("text-anchor", "end")
		.text(settings.xAxisLabel);
	svg.selectAll('.x.axis .tick text')
		.attr("transform", settings.xLabelTransform)
		.attr("text-anchor", settings.xLabelTransform.indexOf('rotate')!==-1? "end":"middle")
		.each(function (name, i) {
			var node = d3.select(this);
			if (tooltips[i]) {
				node.attr('title', tooltips[i]);
			}
			if (data[i][0].url) {
				var txt = node.text();
				node.text('');
				node.append('a').attr("xlink:href", data[i][0]['url']).text(txt);
			}
		});
	
	$(this).on('sort', function(e, order_func) {
		var x0 = xScale.domain(
			data.sort(order_func)
				.map(function(d) {return d[0].name_label;})
		)
			.copy();

		var comp = function(a, b) {
			return x0(a[0].name) - x0(b[0].name);
		};
		svg.selectAll("g.group").sort(comp);
		svg.selectAll(".x.axis.tick").sort(comp);

		var transition = svg.transition().duration(100);
		transition.selectAll("g.group")
			.attr("transform", function(d) {
				return 'translate('+x0(d[0].name_label)+', 0)';
			});
		transition.select(".x.axis")
			.call(xAxis);
			// .selectAll(".tick text")
	});
	
	return {
		vis: svg,
		settings: settings,
		h: height,
		w: width,
		x: xScale,
		xMin: xScale.domain()[0],
		xMax: xScale.domain()[1],
		y: y,
		yMin: y.domain()[0],
		yMax: y.domain()[1],
		color: settings.color,
		xAxis: xAxis,
		yAxis: yAxis
		
	};
};
// Returns a function to compute the interquartile range.
function iqr(k) {
  return function(d, i) {
    var q1 = d.quartiles[0],
        q3 = d.quartiles[2],
        iqr = (q3 - q1) * k,
        idx = -1,
        j = d.length;
    while (d[++idx] < q1 - iqr);
    while (d[--j] > q3 + iqr);
    return [idx, j];
  };
}

//## Double sided bar chart with three columns: left bar, label, right bar ##
$.fn.doubleBarChart = function(d, inSettings) {
	var extraDefaults = {
		leftColLabel: '',
		middleColLabel: '',
		rightColLabel: '',
		barHeight: 10,
		dimension: {w: 630, h: 500, col_w: 200, middle_col_w: 150},
		xMax: false,
		replaceInUrlStr: false,
		paddingInner: 0.65,
		valueLabelPos: 'outside', // [inside|outside]
		valueLabelsPadding: 10,
		logScale: false,
		wrapLongTexts: false,
	};
	var settings = addDefaultPlotSettings(inSettings, extraDefaults);

	// Inner dimension
	var w = settings.dimension.w - settings.padding.l - settings.padding.r; // inner width
  var h = settings.dimension.h - settings.padding.t - settings.padding.b; // inner height
	var colWidth = settings.dimension.col_w;
	var rightOffset = settings.padding.l + colWidth + settings.dimension.middle_col_w;
	var horiz_translate_left = (settings.dimension.w - colWidth - rightOffset - settings.padding.l)/2;
	
	var xMax = 0;
	var c = 0;
	var data = [];
	var legend_data = [];
	for (var i in d) {
		if (!d.hasOwnProperty(i)) {
			continue;
		}
		for (var i2 in d[i]) {
			if (!d[i].hasOwnProperty(i2)) {
				continue;
			}
			xMax = settings.xMax===false? Math.max(xMax, d[i][i2].value) : settings.xMax;
			var c3 = d[i][i2].legend;
			legend_data[c3] = [];
			legend_data[c3]['legend'] = d[i][i2].legend;
			legend_data[c3]['color'] = d[i][i2].color;
		}
		data[c] = d[i];
		data[c].name = i;
		c++;
	}
	legend_data = Object.values(legend_data);

	var xScale = settings.logScale? d3.scaleLog().base(2).domain([1, xMax]) : d3.scaleLinear().domain([0, xMax]);
	xScale.range([0, colWidth]);
	
	var yScale = d3.scaleBand()
		.rangeRound([0, h])
		.paddingInner(settings.paddingInner)
		.domain(data.map(function (d) { return d.name; }));

	var yPosByIndex = function (d, t, elem) {
		var y = 0;
		if (d['left2']) {
			y = yScale(d.name) - yScale.bandwidth()/2;
		}
		else {
			y = yScale(d.name);
		}

		if (elem == 'rect') {
			if (t.indexOf('2') != -1) y += yScale.bandwidth();
		}
		else {
			if (t.indexOf('2') != -1) y += yScale.bandwidth() * 1.5;
			else y += yScale.bandwidth() / 2;
		}
		return y;
	};
	var xPosByType = function (d, t, elem) {
		var x = 0;
		var xV = xScale(d[t].value);
		if (Math.abs(xV) == Infinity) xV = 0;
		if (t.indexOf('left')!=-1) {
			x = colWidth - xV;
			if (elem == 'text') {
				if (settings.valueLabelPos == 'inside') x = colWidth + settings.valueLabelsPadding;
				else x -= settings.valueLabelsPadding;
			}
		}
		else {
			x = rightOffset;
			if (elem == 'text') {
				if (settings.valueLabelPos == 'inside') x = rightOffset - settings.valueLabelsPadding;
				else x += xV + settings.valueLabelsPadding;
			}
		}
		return x;
	};

	var valueLabelPos = function(t) {
		if (settings.valueLabelPos=='inside') {
			return t.indexOf('left')!=-1? "start" : "end";
		}
		else {
			return t.indexOf('left')!=-1? "end" : "start";
		}
	};

  var vis = d3.select($(this).get(0))
		.append("svg")
		.attr("width", settings.dimension.w)
		.attr("height", settings.dimension.h)
		.attr("class", "chart barchart double")
		.append("g")
		.attr("transform", "translate(" + horiz_translate_left + "," + settings.padding.t + ")");

	['left', 'left2', 'right', 'right2'].forEach((t) => {
		vis.selectAll("rect."+t)
			.data(data)
			.enter().append("a")
			.each(function (d, i) {
				if (d[t]) {
					d3.select(this)
						.attr("xlink:href", d[t].url)
						.append("rect")
						.attr("x", xPosByType(d, t, 'rect'))
						.attr("y", yPosByIndex(d, t, 'rect'))
						.attr("class", "bar")
						.attr("width", Math.abs(xScale(d[t].value))==Infinity? 0 : xScale(d[t].value))
						.attr("height", yScale.bandwidth())
						.attr("name", "group"+i)
						.style("fill", d[t].color)
						.attr("title", d[t].tooltip);
				}
			});
			if (settings.valueLabels) {
				vis.append("g")
					.selectAll("text.lables_"+t)
					.data(data)
					.enter().append("a")
					.each(function (d, i) {
						if (d[t]) {
							d3.select(this)
								.attr("xlink:href", d[t].url)
								.append("text")
								.attr("class", "valueLabel")
								.style("text-anchor", valueLabelPos(t))
								.attr("x", xPosByType(d, t, 'text'))
								.attr("y", yPosByIndex(d, t, 'text'))
								.attr("dy", ".35em")
								.attr("title", d[t].tooltip)
								.text(d[t].value);
						}
					});
			}
	});


	var txt = vis.selectAll("text.name")
		.data(data)
		.enter().append("g")
			.attr("transform", function (d) {	return "translate(" + (settings.dimension.middle_col_w/2 + colWidth + settings.padding.l/2) + "," + (yScale(d.name) + yScale.bandwidth()/1.1) + ")"; })
		.append("a")
			.attr("xlink:href", function(d) {
				if (settings.replaceInUrlStr) {
					return d['left'].url.replace(eval('/'+settings.replaceInUrlStr+'/g'), '');
				} else if (d['left'].name_url) {
					return d['left'].name_url;
				} else {
					return '';
				}
			})
			.attr("title", function(d) { return d['left'].name_tooltip ?? ''; });

	let rectW = settings.valueLabelPos=='inside'?30:10;
	txt.append("rect")
			.attr('x', -settings.dimension.middle_col_w/2 + rectW)
			.attr('y', -yScale.bandwidth()-4)
			.attr("width", settings.dimension.middle_col_w - 2*rectW)
		.attr("height", 20)
		.attr("rx", 4)
		.style("fill", function(d) { return d['left'].name_color ?? 'transparent'; });
		//.style("stroke", function(d) { return d3.rgb("#e6653e").darker(); });
	var txtTxt = txt.append("text")
		//.attr("dy", "1.55em")
		.attr("text-anchor", "middle")
		.attr('class', 'name')
		.text(function(d){ return d.name; });
	if (settings.wrapLongTexts) txtTxt.call(D3wrap, settings.dimension.middle_col_w);

	var headers = vis.append("g");
	
	headers.append("text")
		.attr("x",colWidth/2 - (settings.valueLabels ? settings.valueLabelsPadding+20 : 0))
		.attr("y", -10)
		.attr("text-anchor", "middle")
		.attr("class","title")
		.text(settings.leftColLabel);
	headers.append("text")
		.attr("x",settings.dimension.middle_col_w/2 + colWidth + settings.padding.l/2)
		.attr("y", -10)
		.attr("text-anchor", "middle")
		.attr("class","title")
		.text(settings.middleColLabel);
	headers.append("text")
		.attr("x",rightOffset+colWidth/2 + (settings.valueLabels ? settings.valueLabelsPadding+20 : 0))
		.attr("y", -10)
		.attr("text-anchor", "middle")
		.attr("class","title")
		.text(settings.rightColLabel);

	// Legend
	if (settings.legend !== '') {
		var legend = vis.selectAll(".legend")
			.data(legend_data)
			.enter().append("g")
			.attr("class", "legend")
			.attr("name", function(d, i) { return "legend"+d.legend; })
			.attr("transform", function(d, i) { return "translate(0," + i * (settings.legend.size+3) + ")"; });

		legend.append("rect")
			.attr("x", settings.legend.x)
			.attr("y", settings.legend.y)
			.attr("width", settings.legend.size)
			.attr("height", settings.legend.size)
			.style("fill", function(d, i) { return d.color; });

		legend.append("text")
			.attr("x", settings.legend.x+settings.legend.size+2)
			.attr("y", settings.legend.y+settings.legend.size/2)
			.attr("dy", ".35em")
			.text(function(d, i) { return d.legend; });
	}
	return {
		vis: vis,
		settings: settings,
		h: settings.dimension.h,
		w: settings.dimension.w,
		x: xScale,
		xMin: xScale.domain()[0],
		xMax: xScale.domain()[1],
		y: yScale,
		yMin: yScale.domain()[0],
		yMax: yScale.domain()[1],
		color: settings.color
	};
};

function D3wrap(text, width) {
	text.each(function () {
		var text = d3.select(this),
				words = text.text().split(/\s+/).reverse(),
				word,
				line = [],
				lineNumber = 0,
				lineHeight = 1.1, // ems
				x = text.attr("x"),
				y = text.attr("y"),
				dy = 0, //parseFloat(text.attr("dy")),
				tspan = text.text(null)
						.append("tspan")
						.attr("x", x)
						.attr("y", y)
						.attr("dy", dy + "em");
		while (word = words.pop()) {
			line.push(word);
			tspan.text(line.join(" "));
			if (tspan.node().getComputedTextLength() > width) {
				line.pop();
				tspan.text(line.join(" "));
				line = [word];
				tspan = text.append("tspan")
						.attr("x", x)
						.attr("y", y)
						.attr("dy", /*++lineNumber **/ lineHeight + dy + "em")
						.text(word);
			}
		}
	});
}

function getD3Symbol(s) {
	if (s==='cross') return d3.symbolCross;
	else if (s==='diamond') return d3.symbolDiamond;
	else if (s==='square') return d3.symbolSquare;
	else if (s==='star') return d3.symbolStar;
	else if (s==='triangle') return d3.symbolTriangle;
	else if (s==='wye') return d3.symbolWye;
	else return d3.symbolCircle;
}
function getHighlightColor(color) {
	var r = color.match(/(\d+),\s*(\d+),\s*(\d+)/i);
	for (var i = 1; i < 4; i++) {
		r[i] = Math.round(r[i] * 1.2);
	}
	return r;
}

function addDefaultPlotSettings(settings, extraDefaults) {
	if (typeof settings === 'undefined') {
		settings = {};
	}
	if (typeof extraDefaults === 'undefined') {
		extraDefaults = {};
	}
	var defaults = {
		xAxisLabel: '',
		yAxisLabel: '',
		legend: '',
		dimension: {w: 750, h: 400},
		padding: {t: 10, r: 40, b: 30, l: 40},
		color: colorbrewer['Set1'][9],
		xLabelTransform: '',
		valueLabels: false,
		grid: false,
		yTickFormat: ".2s"
	};
	var i;
	for (i in extraDefaults) {
		if (!extraDefaults.hasOwnProperty(i)) {
			continue;
		}
		if (typeof settings[i] === 'undefined') {
			settings[i] = extraDefaults[i];
		}
	}
	for (i in defaults) {
		if (!defaults.hasOwnProperty(i)) {
			continue;
		}
		if (typeof settings[i] === 'undefined') {
			settings[i] = defaults[i];
		}
	}
	return settings;
}
