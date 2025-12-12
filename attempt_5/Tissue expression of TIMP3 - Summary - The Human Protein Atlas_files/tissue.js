$(window).on("load", function() {
	$('#svg_woman, #svg_man').each(function() {
		var svg = $(this.contentDocument).find('svg').attr('id', $(this).attr('id')+'_svg');
		svg.find('g:has(title)[id*=UBERON], path:has(title)[id*=UBERON]').each(function() {
			var t = $(this).find('title:first');
			$(this).attr('title', t.text().charAt(0).toUpperCase() + t.text().slice(1));
			t.remove();
		});
		svg.prependTo($(this).parent());
		$(this).hide();
	});
	
	
	$('.woman')
		.on('toggle_woman', function(e, type) {
			var $svg = $(this).find('svg');
			$('.uberon').each(function() {
				var uberon = $(this).attr('uberon');
				if (!uberon) return;
				var nx = $(this).attr('nx')*1;
				var color = $(this).attr('color');
				uberon = uberon.split(',');
				for (var i=0; i<uberon.length; i++) {
					var $g = $svg.find('.'+uberon).css({'fill':'none', 'opacity':'1'});
					//var $g = $svg.find('[inkscape\\:label="'+uberon[i]+'"]').css({'fill':'none', 'opacity':'1'});
					if (type == 'expression') {
						//var opacity = nx/50;
						var opacity = nx>0? Math.log(nx)/Math.log(6520) : 0;
						$g.css({'fill':'#d90000', 'opacity':opacity});
					}
					else if (type == 'detection') {
						if (nx > 1) $g.css('fill', color);
					}
					else if (type == 'all') {
						$g.css('fill', color);
					}
				}
			});
		})
		.on("click", function(e) {
			var $html = $('<div class="womanContainer" style="background-color:#fff; text-align:center; padding:10px;"></div>').append($('.womanContainer .slideToggle').clone(true), '<br>', $('.womanContainer .woman').clone(true).off('click').css({'width':'400px', 'display':'inline-block'}));
			var options = {
				opacity: 0.9,
				open: true,
				title: '<a href="https://data.humancellatlas.org/analyze/visualization/anatomogram" target="_blank">Anatomogram</a> of '+$('.gene_name').text()+' expression in human tissue. See the <a href="/learn/dictionary">histological dictionary</a> for more tissue information.',
				html: $html,
			};
			$.colorbox(options);
			e.preventDefault();
		})
		.trigger('toggle_woman', 'expression');
		
	$('.tissue_link, .tissue_group, .multiplex_link').on("mouseover", function(e) {
		var uberon = $(this).attr('uberon');
		if ($(e.target).hasClass('tissue_group')) {
			uberon = $(this).find('.tissue_link').map(function() {
				return $(this).attr('uberon');
			}).get().join(',');
		}
		if (!uberon) return;
		uberon = uberon.split(',');
		var color = $(this).closest('.tissue_group').attr('color') ?? $(this).attr('color');
		for (var i=0; i<uberon.length; i++) {
			var $g = $('.woman_center, .man_center').find('.'+uberon[i]);
			if ($g.prop('tagName') == 'use') {
				$g = $('.woman_center, .man_center').find($g.attr('xlink:href'));
			}
			$g.css({'fill':color}).addClass('uberon_color').children().css('fill', '');
		}
	}).on("mouseout", function() {
		var $g = $('.woman_center, .man_center').find('.uberon_color').css({'fill':'none'});
	});
});

function createViolinPlot(id, data, colors, y_scale_unit, width = 600, height = 300, margin = 100) {

	// Define Scales
	const maxVal = d3.max(data, d => d.value);
	const minVal = d3.min(data, d => d.value);
	const xScale = d3.scaleBand().range([0, width]).padding(0.05);
	const yScale = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0]);
	const padding = 50;

	var svg = d3.select("#violinChartImageAnalysis"+id).append("svg").attr("width", width + margin).attr("height", height + margin).style("background-color", "#ffffff");
	var g = svg.append("g").attr("transform", "translate(" + padding + "," + padding + ")");

	var histogram = d3.histogram().domain(yScale.domain()).thresholds(yScale.ticks(20)).value(d => d)

	// Add X axis
	xScale.domain(data.map(d => d.label));
	g.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(xScale));

	// Add Y axis
	g.append("g").call(d3.axisLeft(yScale));
	svg.append("text")
		.attr("transform", "rotate(-90)")  // Rotate so text will be vertical
		.attr("y", 0)                      // Position from left
		.attr("x",0 - (height / 2 + padding))        // Position from top
		.attr("dy", "1em")                 // Position from start of text
		.style("text-anchor", "middle")    // Center the text
		.style("font-size", "14px")        // Set font size
		.style("fill", "#000")             // Set text color
		.text(y_scale_unit);

	var sumstat = d3.nest()
		.key(function(d) { return d.label;})
		.rollup(function(d) {
			input = d.map(function(g) {return g.value;})
			bins = histogram(input)
			//const sum = d3.sum(bins, d => d.length);
			return(bins)
		})
		.entries(data)
	/*
	// use max of all bins as violin scale
					var maxNum = 0
					for ( i in sumstat ){
						 allBins = sumstat[i].value
						 lengths = allBins.map(function(a){return a.length;})
						 longest = d3.max(lengths)
						 if (longest > maxNum) { maxNum = longest }
					}

					var xNum = d3.scaleLinear()
						 .range([1, xScale.bandwidth()])
						 .domain([-maxNum,maxNum])
	*/
	svg.selectAll("violinplot")
		.data(sumstat)
		.enter()
		.append("g")
		.attr("transform", function(d){return("translate(" + xScale(d.key) +" ,0)") } )
		.each(function(d) {
			// Calculate the maximum number in the current group
			var maxNum = d3.max(d.value, function (e) {
				return e.length;
			});

			// new xNum scale for this group only
			var xNum = d3.scaleLinear()
				.range([1, xScale.bandwidth()])
				.domain([-maxNum, maxNum]);

			d3.select(this)
				.append("path")
				.style("fill", function (d) {
					return (colors[d.key])
				})
				.datum(function (d) {
					return (d.value)
				})
				//.attr("class", "violin_title")
				.attr("d", d3.area()
					.x0(function (d) {
						return (xNum(-d.length) + padding)
					})
					.x1(function (d) {
						return (xNum(d.length) + padding)
					})
					.y(function (d) {
						return (yScale(d.x0) + padding)
					})
					.curve(d3.curveCatmullRom)
				)
				.lower();
		})

	// Add pointsjitter
	const jitterWidth = width/Object.keys(colors).length-30;
	svg.selectAll("indPoints").data(data).enter().append("circle")
		.attr('cx', d => xScale(d.label)+padding + xScale.bandwidth() / 2 + Math.random() * jitterWidth - jitterWidth / 2)
		.attr("cy", d => yScale(d.value)+padding).attr("r", 2).style("fill", "gray").style("opacity", "0.1")

}


$.fn.boxPlotMX = function(d_in, inSettings) {
	var extraDefaults = {
		xLabelTransform: 'translate(0,5)',
		yAxisFormat: '.3s',
		boxLabels: true,
		showOutliers: true,
		xPadding: 0.4,
		yMin: false,
		yMax: false,
		yAxisLabelPos: "insideTop", //"outsideMiddle",
		medianTooltip: true,
		medianUnitTooltip: true,
		meanTooltip: false,
		meanUnitTooltip: false,
		samplesTooltip: true,
		outlierFormat: '.2f',
		pointRadius:1
	};
	var settings = addDefaultPlotSettings(inSettings, extraDefaults);

	var width = settings.dimension.w - settings.padding.l - settings.padding.r;
	var height = settings.dimension.h - settings.padding.t - settings.padding.b;

	var data = [];
	var c = 0;

	var yMin = 20;
	var yMax = -20;

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
	let allDataPoints = [];
	data.forEach(group => {
		allDataPoints = allDataPoints.concat(group[1]);
	});
	yMin = d3.min(allDataPoints);
	yMax = d3.max(allDataPoints);

	var chart = d3.box()
		.whiskers(iqr(1.5))
		.height(height)
		.showLabels(settings.boxLabels)
		.showOutliers(settings.showOutliers)
		.tickFormat(d3.format(settings.outlierFormat))
	;
	if (settings.yMin !== false) {
		chart.minVal(settings.yMin);
	} else {
		chart.minVal(yMin);
	}
	if (settings.yMax !== false) {
		chart.maxVal(settings.yMax);
	} else {
		chart.maxVal(yMax);
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
			if (settings.meanTooltip) tooltip += '<br>Mean: '+Math.round(d[0]['data'].reduce((a, b) => a + b, 0)*100/d[1].length)/100;
			if (settings.meanUnitTooltip) tooltip += ' '+settings.yAxisLabel;
			if (settings.samplesTooltip) tooltip += '<br>Samples: '+d[1].length;
			d3.select(this)
				.attr("title", tooltip)
				//.attr("xlink:href", function(d) { return d[0].url; })
				.attr("class", function(d) { return d[0].clss; });
			if (d[0].color) {
				d3.select(this).selectAll('rect').style('fill', d[0].color);
			}
			tooltips[i] = tooltip;
		});

	var name = "";
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
	svg.selectAll("indPoints")
		.data(data)
		.enter()
		.each(function(d,i) {

			name = d[0].name_label;
			d3.select(this).selectAll("indPoints")
				.data(d[0].data)
				.enter()
				.append("circle")
				.attr("cx", function(d) {return xScale(name)+ xScale.bandwidth()/4+Math.random()*xScale.bandwidth()/2})
				.attr("cy", function(d,i) { return y(d)})
				.attr("r", settings.pointRadius)
				.attr("fill",  d[0].color)
				.style("opacity",0.5)
				.attr("stroke", "black")
				.attr("stroke-width",.4)

		})
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
		/*
		// Get the middle point of the axis from the range of the scale
		var yAxisRange = yAxis.scale().range();
		textPosX = Math.abs(yAxisRange[0]-yAxisRange[1])/2 + Math.min(yAxisRange[0], yAxisRange[1]);

		textTransform = "translate("+yAxisRange[1]+","+yAxisRange[0]+") " + textTransform;
		textAnchor = "middle";
		// Align the label outside the tick labels based on the tick labels bounding boxes and add some extra padding.
		textPosY = -10 - Math.ceil(d3.max(yAxisDrawn.selectAll("g.tick").nodes(), function(item) {return item.getBBox().width;}));
		 */
		// Add Y axis
		g.append("g").call(d3.axisLeft(yScale));
		svg.append("text")
			.attr("transform", "rotate(-90)")  // Rotate so text will be vertical
			.attr("y", 0)                      // Position from left
			.attr("x",0 - (height / 2 + padding))        // Position from top
			.attr("dy", "1em")                 // Position from start of text
			.style("text-anchor", "middle")    // Center the text
			.style("font-size", "14px")        // Set font size
			.style("fill", "#000")             // Set text color
			.text(yAxisLabel);
	} else {
		var yAxisLabel = yAxisDrawn.append("text")
			.attr("transform", textTransform)
			.attr("y", textPosY)
			.attr("x", textPosX)
			.style("text-anchor", textAnchor);
		if (settings.yAxisLabel.indexOf("\n") !== -1) {
			var yLabels = settings.yAxisLabel.split("\n");
			var dy = -1 * (yLabels.length - 1);
			for (var idx in yLabels) {
				yAxisLabel.append("tspan")
					.attr("x", textPosX)
					.attr("dy", dy + "em")
					.text(yLabels[idx]);
				dy = 1.2;
			}
		} else {
			yAxisLabel.text(settings.yAxisLabel);
		}
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
		yAxis: yAxis,
		data: data
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


$.fn.multiplexPanelPlot = function(data, inSettings) {
	var plot = {};
	var extraDefaults = {
		yLabels: '',
		yTickFormat: '',
		minY: 0,
		dimension: {w: 730, h: 400},
		padding: {t: 20, r: 20, b: 120, l: 30},
		bgColor: '',
		barWidth: 11,
		xLabelsHide: false,
		extendedTooltip: false,
		radius: 1,
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
		xAxis.tickFormat('');
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
		yMin = plot.yMin = 0.3;
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
			.style("stroke", function(d) { return d.color; })
			.style("stroke-width", 2)
			.attr("y1", function(d) { return yScale(d.value); })
			.attr("x1", function(d) { return xScale.bandwidth()/2 ; })
			.attr("y2", function(d) { return yScale(0); })
			.attr("x2", function(d) { return xScale.bandwidth()/2 ; })

	var bar_hex = link.append("g")
			.attr("class", "hex")
			.attr("transform", function (d) { return "translate("+(xScale.bandwidth()/2)+","+yScale(d.value)+") scale("+d.radius*settings.radius+")"; })
			.append('polygon')
			.attr('points', "20,11.5 0,23 -20,11.5 -20,-11.5 0,-23 20,-11.5")
			//.style("stroke-width","2")
			//.style("stroke","black")
			.style("fill", function(d) { return d.color; });

	if (settings.valueLabels) {
		link.append("text")
				.attr("class", "valueLabel")
				.style("text-anchor", "middle")
				.attr("x", xScale.bandwidth()/2)
				.attr("y", function(d) { return yScale(d.value)+4; })
				.text(function(d) { return d.na? '' : d.value; });
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

	$(this).on('click', '[url]', function() {
		document.location.href = $(this).attr('url');
	});

	// x axis label
	vis.selectAll(".x.axis")
			.append("text")
			.attr("y", 20)
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
		var legend = vis.selectAll(".legend")
				.data(d3.map(data, function(d){return d.legend;}).values())
				.enter().append("g")
				.attr("class", "legend")
				.attr("transform", function(d, i) { return "translate(0," + i * (settings.barWidth+2) + ")"; });

		legend.append("rect")
				.attr("x", settings.legend.x)
				.attr("y", settings.legend.y)
				.attr("width", settings.barWidth)
				.attr("height", settings.barWidth)
				.style("fill", function(d, i) {return d.color; });

		legend.append("text")
				.attr("x", settings.legend.x+settings.barWidth+2)
				.attr("y", settings.legend.y+settings.barWidth/2)
				.attr("dy", ".35em")
				.style("text-anchor", settings.legend.txtAnchor)
				.text(function(d) { return d.legend; });

	}

	/*$(this).on('sort', function(e, order) {
		var x0 = xScale.domain(
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
		vis.selectAll(".bar_g").sort(function(a, b) { return x0(a.value) - x0(b.value); });
		vis.selectAll(".x.axis.tick").sort(function(a, b) { return x0(a.value) - x0(b.value); });

		var transition = vis.transition().duration(100);
		transition.selectAll(".bar_g")
				.attr("transform", function(d) { return 'translate('+x0(d.label)+', 0)'; });
		transition.select(".x.axis")
				.call(xAxis)
				.selectAll(".tick text")
				.style("text-anchor", "end")
				.attr("y", 0)
				.attr("x", -9);
	});*/

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