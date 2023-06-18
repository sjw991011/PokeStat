export function getScatterScaleAxis(scatter, data) {
    const xScale = {};
    const yScale = {};
    const xAxis = {};
    const yAxis = {};
    const stats = ["HP", "Attack","Defense","Special Attack","Special Defense","Speed"];
    const typeWeakness = ["Weakness-Normal","Weakness-Fire","Weakness-Water","Weakness-Electric","Weakness-Grass","Weakness-Ice","Weakness-Fighting","Weakness-Poison","Weakness-Ground","Weakness-Flying","Weakness-Psychic","Weakness-Bug","Weakness-Rock","Weakness-Ghost","Weakness-Dragon","Weakness-Dark","Weakness-Steel","Weakness-Fairy"];

    stats.forEach((el) => {
        const max = d3.max(data, function(d) { return d[el]; });
        xScale[el] = d3.scaleLinear()
            .domain([0, max])
            .range([0, scatter.width])
            .nice();
        
        yScale[el] = d3.scaleLinear()
            .domain([0, max])
            .range([scatter.height, 0])
            .nice();

        xAxis[el] = d3.axisBottom(xScale[el]);
        yAxis[el] = d3.axisLeft(yScale[el]);
    });
    typeWeakness.forEach((el) => {
        xScale[el] = d3.scaleLinear()
            .domain([0, 4])
            .range([0, scatter.width])
            .nice();
        
        yScale[el] = d3.scaleLinear()
            .domain([0, 4])
            .range([scatter.height, 0])
            .nice();

        xAxis[el] = d3.axisBottom(xScale[el]);
        yAxis[el] = d3.axisLeft(yScale[el]);
    });

    return [xScale, yScale, xAxis, yAxis];
};

export function getBarScaleAxis(bar, data) {
    const yScale = {};
    const yAxis = {};
    const stats = ["HP", "Attack","Defense","Special Attack","Special Defense","Speed"];
    const typeWeakness = ["Weakness-Normal","Weakness-Fire","Weakness-Water","Weakness-Electric","Weakness-Grass","Weakness-Ice","Weakness-Fighting","Weakness-Poison","Weakness-Ground","Weakness-Flying","Weakness-Psychic","Weakness-Bug","Weakness-Rock","Weakness-Ghost","Weakness-Dragon","Weakness-Dark","Weakness-Steel","Weakness-Fairy"];

    stats.forEach((el) => {
        const max = d3.max(data, function(d) { return d[el]; });       
        yScale[el] = d3.scaleLinear()
            .domain([0, max])
            .range([bar.height, 0])
            .nice();
        yAxis[el] = d3.axisLeft(yScale[el]);
    });
    typeWeakness.forEach((el) => {
        yScale[el] = d3.scaleLinear()
            .domain([0, 4])
            .range([bar.height, 0])
            .nice();
        yAxis[el] = d3.axisLeft(yScale[el]);
    });

    return [yScale, yAxis];
};