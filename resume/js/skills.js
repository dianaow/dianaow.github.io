function skills() {
    
    var groupChartData = [
    { "0": 7, "1": 10, "skill": "Javascript" }, 
    { "0": 8, "1": 10, "skill": 'D3.js' }, 
    { "0": 7, "1": 10, "skill": 'CSS' },
    { "0": 7, "1": 10, "skill": "React" },
    { "0": 7, "1": 9, "skill": "Python" },
    { "0": 5, "1": 7, "skill": "SQL" },
    { "0": 5, "1": 9, "skill": "Webpack" }, 
    { "0": 4, "1": 4, "skill": "Docker" },
    { "0": 4, "1": 4, "skill": "Matlab" }
    ].reverse()

    var columnsInfo = { "0": "Expertise", "1": "Interest" };

    var barChartConfig = {
        mainDiv: "#skills",
        colorRange: ["#45CFD7", "#0a2756"],
        data: groupChartData,
        columnsInfo: columnsInfo,
        xAxis: "score",
        yAxis: "skill",
        label: {
            xAxis: "score",
            yAxis: "skill"
        },
        requireLegend: true
    };
    var groupChart = new horizontalGroupBarChart(barChartConfig);

}

skills()
