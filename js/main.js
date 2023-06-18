import { colours } from "./type.js";
import { getScatterScaleAxis, getBarScaleAxis } from "./scale.js";
import { nationalDexNumber } from "./nameToDex.js"

let pokemon_all;
let pokemon;
let selected;
let moves = {};
let abilities = {};

const scatter = {
    width: 380,
    height: 380,
    margin: {top: 50, right: 50, bottom: 50, left: 50},
    x: "HP",
    y: "HP",
    t: "Type 1"
}

const bar = {
    width: 380,
    height: 380,
    margin: {top: 50, right: 50, bottom: 50, left: 50},
    order: "HP",
    y: "HP",
    t: "Type 1"
}

const radar = {
    width: 380,
    height: 380,
    margin: {top: 50, right: 50, bottom: 50, left: 50},
    radius: 190
}

const radio = document.querySelectorAll("input[type=radio][name=mode]");
const scatterX = document.getElementById("scatterX");
const scatterY = document.getElementById("scatterY");
const barOrder = document.getElementById("barOrder");
const barY = document.getElementById("barY");
const filterBtn = document.getElementById("filterOut");
const resetBtn = document.getElementById("reset");

const options = ["HP","Attack","Defense","Special Attack","Special Defense","Speed",
                "Weakness-Normal","Weakness-Fire","Weakness-Water","Weakness-Electric","Weakness-Grass","Weakness-Ice",
                "Weakness-Fighting","Weakness-Poison","Weakness-Ground","Weakness-Flying","Weakness-Psychic","Weakness-Bug",
                "Weakness-Rock","Weakness-Ghost","Weakness-Dragon","Weakness-Dark","Weakness-Steel","Weakness-Fairy"];

[scatterX, scatterY, barOrder, barY].forEach(function(selector) {
    options.forEach(function(el) {
        const option = document.createElement("option");
        option.value = el;
        option.innerText = el;
        selector.appendChild(option);
    })
});

scatterX.addEventListener("change", function(e) {
    scatter.x = e.target.value;
    drawScatter();
});

scatterY.addEventListener("change", function(e) {
    scatter.y = e.target.value;
    drawScatter();
});

barOrder.addEventListener("change", function(e) {
    bar.order = e.target.value;
    bar.y = e.target.value;
    drawBar();
});

barY.addEventListener("change", function(e) {
    bar.y = e.target.value;
    drawBar();
});

filterBtn.addEventListener("click", function(e) {
    if (selected == undefined || selected.length == 0) {
        return;
    };
    pokemon = selected;
    drawScatter();
    drawBar();
    drawRadar();
});

resetBtn.addEventListener("click", function(e) {
    pokemon = pokemon_all.filter(function(d) {
        return true;
    });
    drawScatter();
    drawBar();
    drawRadar();
})

let scatterPlot, dots, scatterBrush, scatterTooltip, scatterB,
    barPlot, bars, barBrush, barTooltip, barB,
    radarPlot, radarLine;

const typeToColor = d3.scaleOrdinal()
    .domain(Object.keys(colours))
    .range(Object.values(colours));

Promise.all(['data/gen9_pokemon_stats.csv', 'data/gen9_pokemon_moves.csv', 'data/gen9_pokemon_abilities.csv'].map(d => d3.csv(d, d3.autoType))).then((d) => {
    pokemon_all = d[0];
    // if pokemon has only one type, set its type 2 to its type 1
    pokemon_all.map((el) => {
        if (el["Type 2"] == "NA") {
            el["Type 2"] = el["Type 1"];
        }
    });
    pokemon = pokemon_all.filter(function(d) {
        return true;
    });
    // dictionary with values of pokemons that learn that move
    for (let el of d[1]) {
        if (moves[el.Move] == null) {
            moves[el.Move] = [el.Pokemon];
        }
        else {
            moves[el.Move].push(el.Pokemon);
        }
    }
    // dictionary with values of pokemons that have that ability 
    for (let el of d[2]) {
        if (abilities[el.Ability] == null) {
            abilities[el.Ability] = [el.Pokemon];
        }
        else {
            abilities[el.Ability].push(el.Pokemon);
        }
    }

    initScatter();
    initBar();
    initRadar();

    radio.forEach(function(el) {
        el.addEventListener("change", function(e) {
            if (e.target.value == "brush") {
                scatterBrush = scatterPlot.append("g")
                    .attr("class", "brush")
                    .call(scatterB);
                barBrush = barPlot.append("g")
                    .attr("class", "brush")
                    .call(barB);
            }
            else {
                scatterBrush.remove();
                barBrush.remove();
            }
        });
    });

    drawScatter();
    drawBar();
    drawRadar();
});

function initScatter() {
    [scatter.xScale, scatter.yScale, scatter.xAxis, scatter.yAxis] = getScatterScaleAxis(scatter, pokemon);

    scatterPlot = d3.select("#scatterPlot")
        .append("svg")
            .attr("width", scatter.width + scatter.margin.left + scatter.margin.right)
            .attr("height", scatter.height + scatter.margin.top + scatter.margin.bottom)
        .append("g")
            .attr("transform", "translate(" + scatter.margin.left + "," + scatter.margin.top + ")");

    scatterPlot.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${scatter.height})`)
        .call(scatter.xAxis[scatter.x]);
    
    scatterPlot.append("g")
        .attr("class", "y-axis")
        .call(scatter.yAxis[scatter.y]);

    scatterPlot.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "end")
        .attr("x", scatter.width)
        .attr("y", scatter.height + 40)
        .attr("font-family", "sans-serif")
        .attr("font-size", 18)
        .text(scatter.x);

    scatterPlot.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("font-family", "sans-serif")
        .attr("font-size", 18)
        .attr("dy", "-2em")
        .attr("transform", "rotate(-90)")
        .text(scatter.y);
    
    dots = scatterPlot.append("g")
        .attr("class", "dots");

    scatterB = d3.brush()
        .extent([[0, 0], [scatter.width, scatter.height]])
        .on("start brush", function(e) {
            brushScatterPlot(e);
        })
        .on("end", function(e) {
            scatterBrush.remove();
            scatterBrush = scatterPlot.append("g")
                .attr("class", "brush")
                .call(scatterB);
        });

    scatterBrush = scatterPlot.append("g")
        .attr("class", "brush")
        .call(scatterB);

    scatterTooltip = d3.select("#scatterPlot")
        .append("div")
            .attr("class", "tooltip")
            .style("visibility", "hidden");
}

function drawScatter() {
    const data = pokemon;

    const elem = dots.selectAll("circle")
        .data(data, function(d) { return d.Pokemon; });

    elem.exit()
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();

    elem.enter()
        .append("circle")
            .attr("name", function(d) { return d.Pokemon})
            .attr("cx", function(d) { return scatter.xScale[scatter.x](d[scatter.x]); } )
            .attr("cy", function(d) { return scatter.yScale[scatter.y](d[scatter.y]); } )
            .attr("r", 5)
            .style("fill", function(d) { return typeToColor(d[scatter.t])})
            .style("opacity", 0)
            .attr("stroke", "white")
            .on("mouseover", showScatterTooltip)
            .on("mouseleave", hideScatterTooltip);
    
    dots.selectAll("circle")
        .data(data, function(d) { return d.Pokemon; })
        .transition()
        .duration(500)
        .style("opacity", 0.5)
        .attr("cx", function(d) { return scatter.xScale[scatter.x](d[scatter.x]); } )
        .attr("cy", function(d) { return scatter.yScale[scatter.y](d[scatter.y]); } )
        .style("fill", function(d) { return typeToColor(d[scatter.t])})
    
    scatterPlot.select(".x-axis")
        .transition()
        .duration(500)
        .call(scatter.xAxis[scatter.x]);

    scatterPlot.select(".y-axis")
        .transition()
        .duration(500)
        .call(scatter.yAxis[scatter.y]);

    scatterPlot.select(".x-label")
        .transition()
        .duration(500)
        .text(scatter.x);

    scatterPlot.select(".y-label")
        .transition()
        .duration(500)
        .text(scatter.y);
}

function brushScatterPlot(e) {
    const extent = e.selection;
    selected = pokemon.filter(function(d) {
        return isBrushed(extent, scatter.xScale[scatter.x](d[scatter.x]), scatter.yScale[scatter.y](d[scatter.y]));
    })
    const circles = dots.selectAll("circle")
        .data(pokemon, function(d) { return d.Pokemon; });

    const rects = bars.selectAll("rect")
        .data(pokemon, function(d) { return d.Pokemon; });

    [circles, rects].forEach(function(el) {
        el.classed("selected", function(d) {
            return isBrushed(extent, scatter.xScale[scatter.x](d[scatter.x]), scatter.yScale[scatter.y](d[scatter.y]));
        });
    });

    function isBrushed(brush_coords, cx, cy) {
        const x0 = brush_coords[0][0],
            x1 = brush_coords[1][0],
            y0 = brush_coords[0][1],
            y1 = brush_coords[1][1];
        return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
   }
}

function showScatterTooltip(e, d) {
    scatterTooltip
        .style("visibility", "visible")
        .style("left", (scatter.xScale[scatter.x](d[scatter.x]) + 80) + "px")
        .style("top", (scatter.yScale[scatter.y](d[scatter.y]) + 50) + "px")
        .html(`<img src="./../img/${ nationalDexNumber[d.Pokemon] }.png" width="32px" height="32px"></img>`
            + `${ d.Pokemon } (#${nationalDexNumber[d.Pokemon]})`);
}

function hideScatterTooltip(e, d) {
    scatterTooltip
        .style("visibility","hidden")
        .html("");
}

function initBar() {
    [bar.yScale, bar.yAxis] = getBarScaleAxis(bar, pokemon);
    pokemon.sort(function (a, b) {
        return d3.descending(a[bar.order], b[bar.order]);
    })
    bar.xScale = d3.scaleBand()
        .domain(pokemon.map(function(d) {
            return d.Pokemon;
        }))
        .range([0, bar.width])
        .padding(0.1);
    
    bar.xAxis = d3.axisBottom(bar.xScale).tickFormat("");

    barPlot = d3.select("#barPlot")
        .append("svg")
            .attr("width", bar.width + bar.margin.left + bar.margin.right)
            .attr("height", bar.height + bar.margin.top + bar.margin.bottom)
        .append("g")
            .attr("transform", "translate(" + bar.margin.left + "," + bar.margin.top + ")");

    bars = barPlot.append("g")
        .attr("class", "bars");

    barPlot.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${bar.height})`)
        .call(bar.xAxis);
    
    barPlot.append("g")
        .attr("class", "y-axis")
        .call(bar.yAxis[bar.y]);

    barPlot.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("font-family", "sans-serif")
        .attr("font-size", 18)
        .attr("dy", "-2em")
        .attr("transform", "rotate(-90)")
        .text(bar.y);
    
    barB = d3.brush()
        .extent([[0, 0], [bar.width, bar.height]])
        .on("start brush", function(e) {
            brushBarPlot(e);
        })
        .on("end", function(e) {
            barBrush.remove();
            barBrush = barPlot.append("g")
                .attr("class", "brush")
                .call(barB);
        });

    barBrush = barPlot.append("g")
        .attr("class", "brush")
        .call(barB);

    barTooltip = d3.select("#barPlot")
        .append("div")
            .append("div")
            .attr("class", "tooltip")
            .style("visibility", "hidden");
}

function drawBar() {
    const data = pokemon;

    data.sort(function (a, b) {
        return d3.descending(a[bar.order], b[bar.order]);
    })
    bar.xScale = d3.scaleBand()
        .domain(pokemon.map(function(d) {
            return d.Pokemon;
        }))
        .range([0, bar.width])
        .padding(0.1);
    
    bar.xAxis = d3.axisBottom(bar.xScale).tickFormat("");

    const elem = bars.selectAll("rect")
        .data(data, function(d) { return d.Pokemon; });

    elem.exit()
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();

    elem.enter()
        .append("rect")
            .attr("name", function(d) { return d.Pokemon; })
            .attr("x", function(d) { return bar.xScale(d.Pokemon); })
            .attr("width", bar.xScale.bandwidth())
            .attr("y", function(d) { return bar.yScale[bar.y](d[bar.y]); })
            .attr("height", function(d) { return bar.height - bar.yScale[bar.y](d[bar.y]); })
            .style("fill", function(d) { return typeToColor(d[scatter.t])})
            .style("opacity", 0)
            .attr("stroke", "white")
            .on("mouseover", showBarTooltip)
            .on("mouseleave", hideBarTooltip);
    
    bars.selectAll("rect")
        .data(data, function(d) { return d.Pokemon; })
        .transition()
        .duration(500)
        .style("opacity", 0.5)
        .attr("x", function(d) { return bar.xScale(d.Pokemon); })
        .attr("width", bar.xScale.bandwidth())
        .attr("y", function(d) { return bar.yScale[bar.y](d[bar.y]); })
        .attr("height", function(d) { return bar.height - bar.yScale[bar.y](d[bar.y]); })
        .style("fill", function(d) { return typeToColor(d[scatter.t])})
    
    barPlot.select(".x-axis")
        .transition()
        .duration(500)
        .call(bar.xAxis);

    barPlot.select(".y-axis")
        .transition()
        .duration(500)
        .call(bar.yAxis[bar.y]);

    barPlot.select(".y-label")
        .transition()
        .duration(500)
        .text(bar.y);
}

function brushBarPlot(e) {
    const extent = e.selection;
    selected = pokemon.filter(function(d){
        return isBrushed(extent, bar.xScale(d.Pokemon), bar.yScale[bar.y](d[bar.y]))
    })
    const circles = dots.selectAll("circle")
        .data(pokemon, function(d) { return d.Pokemon; });

    const rects = bars.selectAll("rect")
        .data(pokemon, function(d) { return d.Pokemon; });

    [circles, rects].forEach(function(el) {
        el.classed("selected", function(d){
            return isBrushed(extent, bar.xScale(d.Pokemon), bar.yScale[bar.y](d[bar.y]))
        });
    });

    function isBrushed(brush_coords, x, y) {
        const x0 = brush_coords[0][0],
            x1 = brush_coords[1][0],
            y0 = brush_coords[0][1],
            y1 = brush_coords[1][1];
        return ((x + bar.xScale.bandwidth()) >= x0) && (x <= x1) && (y <= y1) && (bar.height >= y0);
    }
}

function showBarTooltip(e, d) {
    barTooltip
        .style("visibility", "visible")
        .style("left", (bar.xScale(d.Pokemon) + 80) + "px")
        .style("top", (bar.yScale[bar.y](d[bar.y]) - 20) + "px")
        .html(`<img src="./../img/${ nationalDexNumber[d.Pokemon] }.png" width="32px" height="32px"></img>`
            + `${ d.Pokemon } (#${nationalDexNumber[d.Pokemon]})`);
}

function hideBarTooltip(e, d) {
    barTooltip
        .style("visibility","hidden")
        .html("");
}

function initRadar() {
    radarPlot = d3.select("#radarPlot")
        .append("svg")
            .attr("width", radar.width + radar.margin.left + radar.margin.right)
            .attr("height", radar.height + radar.margin.top + radar.margin.bottom)
        .append("g")
            .attr("transform", "translate(" + radar.margin.left + "," + radar.margin.top + ")");
    
    radar.rScale = d3.scaleLinear()
        .domain([0, 200])
        .range([0, radar.radius]);
    
    radar.ticks = [0, 40, 80, 120, 160, 200];

    const axes = [["HP", "HP"],
                ["Attack", "ATK"],
                ["Defense", "DEF"],
                ["Speed", "SPE"],
                ["Special Defense", "SPD"],
                ["Special Attack", "SPA"]];

    radarPlot.selectAll("circle")
        .data(radar.ticks)
        .enter()
        .append("circle")
            .attr("cx", radar.width / 2)
            .attr("cy", radar.height / 2)
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("r", function(d) { return radar.rScale(d); });
    
    radarPlot.selectAll(".ticklabels")
        .data(radar.ticks)
        .enter()
        .append("text")
        .attr("class", "ticklabels")
        .attr("x", radar.width / 2 + 10)
        .attr("y", function(d) { return radar.height / 2 - radar.rScale(d); })
        .text(function(d) { return d.toString(); })

    radar.axes = axes.map(function(e, i) {
        const angle = Math.PI / 2 - (Math.PI * i / 3);
        return {
            "name": e[0],
            "code": e[1],
            "angle": angle,
            "lineCoord": angleToCoord(angle, 200),
            "labelCoord": angleToCoord(angle, 220)
        };
    });

    radarPlot.selectAll("line")
        .data(radar.axes)
        .enter()
        .append("line")
        .attr("x1", radar.width / 2)
        .attr("y1", radar.height / 2)
        .attr("x2", d => d.lineCoord.x)
        .attr("y2", d => d.lineCoord.y)
        .attr("stroke","gray");
    
    radarPlot.selectAll(".axeslabels")
        .data(radar.axes)
        .enter()
        .append("text")
        .attr("class", "axeslabels")
        .attr("x", function(d) { return d.labelCoord.x - 10; })
        .attr("y", function(d) { return d.labelCoord.y; })
        .text(function(d) { return d.code; });

    const initialCoord = [];
    for (let i = 0; i < 6; i++) {
        initialCoord.push({"x": radar.width / 2, "y":radar.height / 2});
    }

    radarLine = d3.line()
        .x(d => d.x)
        .y(d => d.y);

    radarPlot.append("path")
        .datum(initialCoord)
        .attr("d", radarLine)
        .attr("stroke-width", 3)
        .attr("fill", "blue")
        .attr("stroke-opacity", 1)
        .attr("opacity", 0.5)
}

function drawRadar() {
    const data = pokemon;
    const average = {};
    const stats = ["HP", "Attack", "Defense", "Speed", "Special Defense", "Special Attack"];
    stats.forEach(function(el) {
        average[el] = d3.mean(data, function(d) {
            return d[el];
        });
    });
    const coords = [];
    stats.forEach(function(el, i) {
        const angle = Math.PI / 2 - (Math.PI * i / 3);
        coords.push(angleToCoord(angle, average[el]));
    });
    
    radarPlot.selectAll("path")
        .datum(coords)
        .transition()
        .duration(500)
        .attr("d", radarLine);
}

function angleToCoord(angle, value) {
    let x = Math.cos(angle) * radar.rScale(value);
    let y = Math.sin(angle) * radar.rScale(value);
    return {"x": radar.width / 2 + x, "y": radar.height / 2 - y};
}