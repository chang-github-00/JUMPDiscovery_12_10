function createCancerPlots(id, scatter_data_json, kaplan_data_json, bestCutoff_in) {
	var scatter_data = scatter_data_json;
	var kaplan_data = kaplan_data_json;
	var bestCutoff = bestCutoff_in;
	var selectedCutoff = bestCutoff;
	var quantile20 = 0;
	var quantile80 = 0;
	var settings = {
		'transitionTime': 1000,
		'labelSpace': 60,
		'labelWidth': 35,
		'labelHeight': 20,
		xAxisLabel: 'Expression level (pTPM)',
		yAxisLabel: 'Time after diagnosis (years)',
		yTickFormat: '2.0f',
		xMin: 0,
		yMin: 0,
		color: [],
		dimension: {w:890, h:660},
		padding: {t:150+60, r:150+60, b:160, l:50},
		legend:{x:680,y:-110,size:11}
	};

	var $divScatter = $('#scatter'+id);
	var $divContainer = $divScatter.closest('.cancer');
	var plot = $divScatter.scatterPlot(scatter_data, settings);
	var kmPlot;
	
	// Days lables & legend	
	var lgnd = {2:{'name':'Density dead', 'clss':'dead'}, 3:{'name':'Density alive', 'clss':'alive'}, 4:{'name':'Density dead under cut off', 'clss':'under'}, 5:{'name':'Density dead over cut off', 'clss':'over'}};
	for (var k in lgnd) {
		var clss = lgnd[k].clss;
		// Median labels
		var g = plot.vis.append('g')
			.attr("class", "median median_"+clss);
		g.append('path');
		g.append('rect')
			.attr("class", "area")
			.attr('rx', 5)
			.attr('ry', 5)
			.attr('width', plot.settings.labelWidth)
			.attr('height', plot.settings.labelHeight);
		g.append('text')
			.attr('text-anchor', 'middle')
			.attr('dx', plot.settings.labelWidth/2)
			.attr('dy', plot.settings.labelHeight/2+3);
		setLabelPos(plot, clss, k);
		// legend
		var l = plot.vis.append('g')
			.attr("class", "legend legend"+k)
			.attr("transform", "translate("+plot.settings.legend.x+","+(plot.settings.legend.y + k*(plot.settings.legend.size+2))+")");
		l.append("path")
			.datum(get_gauss(plot.settings.legend.size, k<4))
			.attr("class", "area area_"+clss)
			.attr("d", d3.area()
				.x(function(d) { return d[0]; })
				.y0(plot.settings.legend.size)
				.y1(function(d) { return d[1]; })
			);
		l.append("text")
			.attr("x", plot.settings.legend.size+2)
			.attr("y", plot.settings.legend.size/2)
			.attr("dy", ".35em")
			.text(lgnd[k].name);
	}
	plot.vis.selectAll('.legend0 rect').remove();
	plot.vis.selectAll('.legend0')
		.append('path')
		.attr("transform", "translate(0, "+plot.settings.legend.size/2+")")
		.attr('d', d3.symbol().size(60).type(getD3Symbol('cross')));
	plot.vis.selectAll('.legend1 rect').remove();
	plot.vis.selectAll('.legend1')
		.append('path')
		.attr("transform", "translate(0, "+plot.settings.legend.size/2+")")
		.attr('d', d3.symbol().size(60).type(getD3Symbol('circle')));
	
	// TPM density
	var xd = plot.vis.append('g')
		.attr('class', 'tpm_density')
		.attr("transform", "translate(0,-" + plot.settings.padding.t + ")");
	xd.append("path").attr("class", "area area0");
	xd.append("path").attr("class", "area area1");
	
	// DAYS density
	var yd = plot.vis.append('g')
		.attr('class', 'days_density')
		.attr("transform", "translate(" + (plot.w+10) + ", 0)");
	yd.append("path").attr("class", "area area_under");
	yd.append("path").attr("class", "area area_over");
	
	// P-value plot
	var p_y = d3.scaleLinear()
			.range([plot.settings.padding.b-60, 0]);
	var p_yAxis = d3.axisLeft()
		.scale(p_y)
		.ticks(5);
	var p_line = d3.line()
		.x(function(d) { var lx = plot.x(d.x); return lx==-Infinity?1:lx; })
		.y(function(d) { var ly = p_y(d.y); return ly==-Infinity?1:ly; });
	var xp = plot.vis
		.append('g')
		.attr('class', 'p_value')
		.attr('transform', 'translate(0,' + (plot.h+50)+ ')');
	xp.append('rect')
		.attr('class', 'plotBG')
		.attr('width', plot.w)
		.attr('height', plot.settings.padding.b-60);
	xp.append('g')
		.attr('class', 'p-axis axis')
		.call(p_yAxis)
		.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', 10)
		.attr('x', -2)
		.attr('class', 'label')
		.style('text-anchor', 'end')
		.text('P score');
	xp.append('path')
		.attr('class', 'p_value')
		.attr('fill', 'none')
		.attr('stroke', '#000');
	var pl = plot.vis.append('g')
			.attr("class", "legend legend6")
			.attr("transform", "translate("+plot.settings.legend.x+","+(plot.h+60)+")");
		pl.append("rect")
			.attr("width", plot.settings.legend.size)
			.attr("height", plot.settings.legend.size)
			.style("fill", '#000');
		pl.append("text")
			.attr("x", plot.settings.legend.size+2)
			.attr("y", plot.settings.legend.size/2)
			.attr("dy", ".35em")
			.text('P score');
	// Dead medain plot
	var m_y = d3.scaleLinear()
			.range([plot.settings.padding.b-60, 0]);
	var m_yAxis = d3.axisRight()
		.scale(m_y)
		.ticks(5);
	var m_line = d3.line()
		.x(function(d) { var lx = plot.x(d.x); return lx==-Infinity?1:lx; })
		.y(function(d) { var ly = m_y(d.y); return ly==-Infinity?0:ly; });
	xp.append('g')
		.attr('class', 'm-axis axis')
		.attr('transform', 'translate('+plot.w+',0)')
		.call(m_yAxis)
		.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', -5)
		.attr('x', -2)
		.attr('class', 'label')
		.style('text-anchor', 'end')
		.text('Medain separation');
	xp.append('path')
		.attr('class', 'm_value')
		.attr('fill', 'none')
		.attr('stroke', '#d90036');
	var ml = plot.vis.append('g')
			.attr("class", "legend legend7")
			.attr("transform", "translate("+plot.settings.legend.x+","+(plot.h+60+plot.settings.legend.size+2)+")");
		ml.append("rect")
			.attr("width", plot.settings.legend.size)
			.attr("height", plot.settings.legend.size)
			.style("fill", '#d90036');
		ml.append("text")
			.attr("x", plot.settings.legend.size+2)
			.attr("y", plot.settings.legend.size/2)
			.attr("dy", ".35em")
			.text('Dead median separation');
	
	// Cut off line
	var g = plot.vis.append('g')
		.attr("class", "cutoff")
		.attr("title", "Cut off (pTPM "+selectedCutoff.toPrecision(2)+")")
		.attr("xVal", selectedCutoff);
	g.append('line')
		.attr("class", "hiddenline")
		.attr("pointer-events", "all")
		.attr('y1', -plot.settings.padding.t+plot.settings.labelSpace)
		.attr('y2', plot.settings.dimension.h-plot.settings.padding.t-10);
	g.append('line')
		.attr("pointer-events", "none")
		.attr('y1', -plot.settings.padding.t+plot.settings.labelSpace)
		.attr('y2', plot.settings.dimension.h-plot.settings.padding.t-10);
	g.append('text')
		.attr("transform", "rotate(-90)")
		.attr("y", 10)
		.attr("x", -plot.h-47)
		.text("Cut off");
	g.call(d3.drag()
		.on("drag", function(d) {
			xPos = Math.max(plot.x(quantile20), Math.min(d3.event.x, plot.x(quantile80)));
			d3.select(this).attr("transform", "translate(" + xPos + "," + 0 + ")")
		})
		.on("end", function(d) {
			xPos = Math.max(plot.x(quantile20), Math.min(d3.event.x, plot.x(quantile80)));
			$divScatter.trigger('setCutoff', plot.x.invert(xPos), true);
		})
	);
	
	// FIX DATA
	var median;
	var sc_x = d3.scaleLinear().range([0, plot.settings.padding.r-10-plot.settings.labelSpace]);
	var sc_y = d3.scaleLinear().range([plot.settings.padding.t-10, plot.settings.labelSpace]);
	$divScatter.on('fixdata', function(e, skipPvalue) {
		var t = d3.transition().duration(plot.settings.transitionTime);
		// Survival analysis
		var surv = get_survival_data(kaplan_data, selectedCutoff, true, true);
		quantile20 = surv.q20;
		quantile80 = surv.q80;
		if (selectedCutoff < quantile20 || selectedCutoff > quantile80) {
			$divScatter.trigger('setCutoff', selectedCutoff, false);
			return false;
		}
		$divContainer.find('.pValue').html(surv.p.pValue.toPrecision(2));
		$divContainer.find('.tpm_median').attr('value', surv.median['tpm']).html(Math.round(surv.median['tpm']*100)/100);
		$divContainer.find('.days_median').html(Math.round(surv.median['days']*100)/100);
		$divContainer.find('.5y_over').html((surv.survival_5y['over']||0)+'%');
		$divContainer.find('.5y_under').html((surv.survival_5y['under']||0)+'%');
		$divContainer.find('.3y_over').html((surv.survival_3y['over']||0)+'%');
		$divContainer.find('.3y_under').html((surv.survival_3y['under']||0)+'%');
		
		if (kmPlot) {
			kmPlot.fixData(surv.km, kmPlot.y, kmPlot.settings.showCensor);
			kmPlot.vis.selectAll('.legend0 text').text('Low expression (n='+surv.under+')');
			kmPlot.vis.selectAll('.legend1 text').text('High expression (n='+surv.over+')');
			kmPlot.vis.selectAll(".group0 path")
				.transition(t)
				.attr('d', kmPlot.line(surv.km[0]));
			kmPlot.vis.selectAll(".group1 path")
				.transition(t)
				.attr('d', kmPlot.line(surv.km[1]));
		}
		else {
			kmPlot = $divContainer.find('.kaplanplot').html('').kaplanMeierPlot({'groups':surv.groups, 'data':surv.km}, {transitionTime:plot.settings.transitionTime, xAxisLabel:'Time (years)', yAxisLabel:'Survival probability', yMin:0, yMax:1, color:[], dimension:{w:890, h:420}, padding:{t:30, r:210, b:40, l:50}, legend:{x:680,y:20,size:11}});
		}
		// TPM density
		median = surv.median;
		var tpm_kde_max = 0;
		for (var i in surv.tpm_data) {
			if (!surv.tpm_data.hasOwnProperty(i)) continue;
			var fd = surv.tpm_data[i];
			var tpm_kde = fd.length>1? ss.kernelDensityEstimation(fd) : function(d) { return 0; };
			var tpm_bins = d3.histogram().domain(plot.x.domain()).thresholds(500)(fd);
			tpm_bins.map(function(d) {
				d.kde = tpm_kde(d.x0);
				tpm_kde_max = Math.max(tpm_kde_max, d.kde);
			});
			plot.vis.selectAll(".tpm_density path.area"+i).datum(tpm_bins);
		}
		sc_y.domain([0, tpm_kde_max*1.01]);
		// Days density
		var days_kde_max = 0;
		for (var k in surv.days_data) {
			if (!surv.days_data.hasOwnProperty(k)) continue;
			var dd = surv.days_data[k];
			var days_kde = dd.length>1? ss.kernelDensityEstimation(dd) : function(d) { return 0; };
			var days_bins = d3.histogram().domain(plot.y.domain()).thresholds(500)(dd);
			days_bins.map(function(d) {
				d.kde = days_kde(d.x0);
				days_kde_max = Math.max(days_kde_max, d.kde);
			});
			plot.vis.selectAll('.days_density path.area_'+k).datum(days_bins);
		}
		sc_x.domain([0, days_kde_max*1.01]);
		// P-value & median-diff plot
		if (!skipPvalue) {
			var step = (quantile80 - quantile20) / 100;
			var pxMin = 0;
			var pMin = 1;
			var pMax = 0;
			var pData = [];
			var mMin = 1;
			var mMax = 0;
			var mData = [];
			for (var f=quantile20; f<=quantile80; f+=step) {
				var surv = get_survival_data(kaplan_data, f);
				pData.push({'x':f, 'y':surv.p.pValue});
				pMax = Math.max(pMax, surv.p.pValue);
				if (pMin > surv.p.pValue) {
					pMin = surv.p.pValue;
					pxMin = (surv.over+surv.under==kaplan_data.length)? bestCutoff : f;
				}
				var mVal = Math.abs(surv.median['over']-surv.median['under']);
				mData.push({'x':f, 'y':mVal});
				mMax = Math.max(mMax, mVal);
				mMin = Math.min(mMin, mVal);
			}
			p_y.domain([pMin, pMax]);
			plot.vis.selectAll("g.p_value .p-axis").transition(t).call(p_yAxis);
			plot.vis.selectAll("g.p_value path.p_value").datum(pData);
			m_y.domain([mMax, mMin]);
			plot.vis.selectAll("g.p_value .m-axis").transition(t).call(m_yAxis);
			plot.vis.selectAll("g.p_value path.m_value").datum(mData);
			$divContainer.find('a.best').attr('value', pxMin).html(Math.round(pxMin*100)/100);
		}
	}).trigger('fixdata');
	
	// RESCALE
	$divScatter.on('rescale', function(e, scale, time) {
		var t = d3.transition().duration(time? time : plot.settings.transitionTime);
		// TPM
		plot.vis.selectAll('.tpm_density path')
			.transition(t)
			.attr("d", d3.area()
				.x(function(d) { return plot.x(d.x0)==-Infinity?0:plot.x(d.x0); })
				.y0(plot.settings.padding.t-10)
				.y1(function(d) { return Math.max(1e-35, sc_y(d.kde)); })
			);
		// Days
		plot.vis.selectAll('.days_density path')
			.transition(t)
			.attr("d", d3.area()
				.y(function(d) { return plot.y(d.x0); })
				.x0(0)
				.x1(function(d) { return Math.max(1e-35, sc_x(d.kde)); })
			);
		// Cutoff
		plot.vis.selectAll("g.cutoff")
			.transition(t)
			.attr("transform", "translate(" + Math.max(1e-35, plot.x(selectedCutoff)) + "," + 0 + ")");
		// P-value
		plot.vis.selectAll("g.p_value path.p_value")
			.transition(t)
			.attr('d', function(d) { return p_line(d); });
		plot.vis.selectAll("g.p_value path.m_value")
			.transition(t)
			.attr('d', function(d) { return m_line(d); });
		// Median labels
		var medians = [];
		medians.push({'clss':'dead', 'median':median[0], 'pos':median[0]>median[1]?3:2, 'f':plot.x, 'title':'Median dead ([d] pTPM)'});
		medians.push({'clss':'alive', 'median':median[1], 'pos':median[0]>median[1]?2:3, 'f':plot.x, 'title':'Median alive ([d] pTPM)'});
		medians.push({'clss':'under', 'median':median['under'], 'pos':median['under']>median['over']?4:5, 'f':plot.y, 'title':'Median dead under cut off ([d] years)'});
		medians.push({'clss':'over', 'median':median['over'], 'pos':median['under']>median['over']?5:4, 'f':plot.y, 'title':'Median dead over cut off ([d] years)'});
		for (var m in medians) {
			if (!medians.hasOwnProperty(m)) continue;
			setLabelPos(plot, medians[m].clss, medians[m].pos, medians[m].median.toPrecision(2), medians[m].title.replace('[d]', medians[m].median.toPrecision(3)), Math.max(1e-35, medians[m].f(medians[m].median)));
		}
	}).trigger('rescale', '', 0);
	
	$divScatter.on('setCutoff', function(e, cutoff, skipPvalue) {
		selectedCutoff = Math.max(quantile20, Math.min(quantile80, cutoff));
		$divContainer.find('input.cutoff').val(Math.round(selectedCutoff*100)/100);
		d3.select(this).selectAll('.cutoff')
			.attr('title', 'Cut off (pTPM '+Math.round(selectedCutoff*100)/100+')')
			.attr("xVal", selectedCutoff);
		$(this).trigger('fixdata', skipPvalue).trigger('rescale');
	});
}
