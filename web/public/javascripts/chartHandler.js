/**
 * Manages and updates Chart.js and Google charts with data from the datalake
 */

/**
 * Updates Tree Chart with the data that is associated with the map
 *
 * @param {[String]} chartLabels
 * @param {[[String,String,String,Number]]} chartData
 * @param {String} dataValueType
 */
function updateMapChart(chartLabels, chartData, dataValueType) {
  google.charts.load("current", {
    "packages": ["treemap"]
  });
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {

    var dataForDataTable = [chartLabels, ["United States", null, 0]];
    var countiesInData = [];
    var statesInData = [];

    for (var city = 0; city < chartData.length; city++) {
      if (!statesInData.includes(chartData[city][2])) {
        statesInData.push(chartData[city][2]);
        dataForDataTable.push([chartData[city][2], "United States", 0]);
      }

      if (!countiesInData.includes(chartData[city][1])) {
        countiesInData.push(chartData[city][1]);

        if (chartData[city][1] == chartData[city][0]) {
          dataForDataTable.push([chartData[city][1], chartData[city][2], chartData[city][3]]);
        } else {
          dataForDataTable.push([chartData[city][1], chartData[city][2], 0]);
        }
      }

      if (chartData[city][1] != chartData[city][0]) {
        dataForDataTable.push([chartData[city][0], chartData[city][1], chartData[city][3]]);
      }
    }

    if (statesInData.length == 1) {
        dataForDataTable.splice(1,1);
        dataForDataTable[1][1] = null;
    }

    var data = google.visualization.arrayToDataTable(dataForDataTable);

    tree = new google.visualization.TreeMap(document.getElementById("mapChart"));

    tree.draw(data, {

      minColor: '#CCEEF2',
      midColor: '#00ABC0',
      maxColor: '#F88F58',
      headerHeight: 15,
      fontColor: "black",
      showScale: true,
      generateTooltip: showFullTooltip
    });

    function showFullTooltip(row, size, value) {
      switch (dataValueType) {
        case "total":
          return "<div style='background:#fd9; padding:10px; border-style:solid'>" +
            "<b>" + data.getValue(row, 0) + "</b><br>" +
            data.getColumnLabel(2) + ": " + size + "</div>";

          break;
        case "percentage":
          if (data.getValue(row, 1) && data.getValue(row, 1).includes("County")) {
            return "<div style='background:#fd9; padding:10px; border-style:solid'>" +
              "<b>" + data.getValue(row, 0) + "</b><br>" +
              data.getColumnLabel(2) + ": " + size + "</div>";
          } else {
            return "<div style='background:#fd9; padding:10px; border-style:solid'>" +
              "<b>" + data.getValue(row, 0) + "</b>";
          }

          break;
        default:
      }
    }

  }

}

/**
 * Updates bar chart for age of developing/outgrowing allergies data
 *
 * @param {[Number]} chartData
 * @param {String} dataLabel
 */
function updateAgeChart(chartData, dataLabel) {
  removeAgeChart();

  var result = getAgeChartData(chartData);
  var chartLabels = result[0];
  chartData = result[1];

  var chartDiv = document.getElementById("chart");
  var newCanvas = document.createElement('canvas');
  newCanvas.setAttribute('id', 'ageChart');
  chartDiv.appendChild(newCanvas);
  var ctx = document.getElementById("ageChart").getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartLabels,
      datasets: [{
        label: dataLabel,
        data: chartData,
        borderWidth: 1,
        backgroundColor: '#CCEEF2'
      }]
    },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }],
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Ages'
          }
        }]
      }
    }
  });
}

/**
 * Removes age chart from web page
 */
function removeAgeChart() {
  var ageChart = document.getElementById("ageChart");
  if (ageChart) {
    ageChart.remove();
  }
}

/**
 * Gets frequency of ages from the data by age ranges
 *
 * @param {[Number]} chartData
 */
function getAgeChartData(chartData) {

    var labels = [];
    var data = [];

    for (var label = 0; label < 29; label++) {
        labels.push((5*label) + "-" + (5*label + 4));
        data.push(0);
    }
    
    for (var age = 0; age < chartData.length; age++) {
        var index = Math.floor(chartData[age] / 5);
        data[index] = data[index] + 1;
    }

    for (var index = 28; index >= 0; index--) {
        if (data[index] != 0) {
            break;
        }
    }

    if (index != 28) {
        labels.splice(index+1, 28 - index);
        data.splice(index+1, 28 - index);
    }

  return [labels, data];
}

/**
 * Updates statistics that are associated with the data from the map
 *
 * @param {String} dataType
 * @param {Object} data
 * @param {String} allergy
 * @param {String} dataValueType
 */
function updateStats(dataType, data, allergy, dataValueType) {
    var titleDiv = document.getElementById('statTitle');
    var minDiv = document.getElementById('min');
    var maxDiv = document.getElementById('max');
    var meanDiv = document.getElementById('mean');
    var totalTooltip = document.getElementById('totalTooltiptext');
    var populationTooltip = document.getElementById('percentageTooltiptext');

    switch (dataType) {
        case "population":
            totalTooltip.innerHTML = "Total population by city";
            populationTooltip.innerHTML = "City's percentage of total population";
            titleDiv.innerHTML = "Population stats";

            switch (dataValueType) {
                case "total":  
                    minDiv.innerHTML = "Min: " + data.populationStats.min.population + " (" + data.populationStats.min.city + ", " + data.populationStats.min.state + ")";
                    maxDiv.innerHTML = "Max: " + data.populationStats.max.population + " (" + data.populationStats.max.city + ", " + data.populationStats.max.state + ")";
                    meanDiv.innerHTML = "Mean: " + Math.round(data.populationStats.mean * 100) / 100;

                    break;
                case "percentage":
                    var min = data.populationStats.min.percentage*100;
                    var max = data.populationStats.max.percentage*100;
                    var mean = (1/data.populationStats.cities.length)*100;

                    minDiv.innerHTML = "Min: " + Math.round(min * 100) / 100 + "% (" + data.populationStats.min.city + ", " + data.populationStats.min.state + ")";
                    maxDiv.innerHTML = "Max: " + Math.round(max * 100) / 100 + "% (" + data.populationStats.max.city + ", " + data.populationStats.max.state + ")";
                    meanDiv.innerHTML = "Mean: " + Math.round(mean * 100) / 100 + "%";

                    break;
                default:
            }

            break;
        case "developed":
            totalTooltip.innerHTML = "Population by city that developed " + allergy + " allergy";
            populationTooltip.innerHTML = "Percentage of each city that developed " + allergy + " allergy";
            titleDiv.innerHTML = "Developing allergy stats for cities with " + allergy + " allergy";

            switch (dataValueType) {
                case "total":
                    for (let i = 0; i < data.allergyStats.stats.developed.length; i++) {
                        if (allergy == data.allergyStats.stats.developed[i].allergy) {
                            minDiv.innerHTML = "Min: " + data.allergyStats.stats.developed[i].min.total.min + " (" + data.allergyStats.stats.developed[i].min.total.city + ", " + data.allergyStats.stats.developed[i].min.total.state + ")";
                            maxDiv.innerHTML = "Max: " + data.allergyStats.stats.developed[i].max.total.max + " (" + data.allergyStats.stats.developed[i].max.total.city + ", " + data.allergyStats.stats.developed[i].max.total.state + ")";
                            meanDiv.innerHTML = "Mean: " + Math.round(data.allergyStats.stats.developed[i].mean.total * 100) / 100;
                        }
                    }

                    break;
                case "percentage":
                    for (let i = 0; i < data.allergyStats.stats.developed.length; i++) {
                        if (allergy == data.allergyStats.stats.developed[i].allergy) {
                            var min = data.allergyStats.stats.developed[i].min.percentage.min*100;
                            var max = data.allergyStats.stats.developed[i].max.percentage.max*100;
                            var mean = data.allergyStats.stats.developed[i].mean.percentage*100;

                            minDiv.innerHTML = "Min: " +  Math.round(min * 100) / 100 + "% (" + data.allergyStats.stats.developed[i].min.percentage.city + ", " + data.allergyStats.stats.developed[i].min.percentage.state + ")";
                            maxDiv.innerHTML = "Max: " +  Math.round(max * 100) / 100 + "% (" + data.allergyStats.stats.developed[i].max.percentage.city + ", " + data.allergyStats.stats.developed[i].max.percentage.state + ")";
                            meanDiv.innerHTML = "Mean: " +  Math.round(mean * 100) / 100 + "%";
                        }
                    }

                    break;
                default:
            }

            break;
        case "outgrown":
            totalTooltip.innerHTML = "Population by city that outgrew " + allergy + " allergy";
            populationTooltip.innerHTML = "Percentage of each city outgrew " + allergy + " allergy";
            titleDiv.innerHTML = "Outgrowing allergy stats for cities with " + allergy + " allergy";
            
            switch (dataValueType) {
                case "total":
                    for (let i = 0; i < data.allergyStats.stats.outgrown.length; i++) {
                        if (allergy == data.allergyStats.stats.outgrown[i].allergy) {
                            minDiv.innerHTML = "Min: " + data.allergyStats.stats.outgrown[i].min.total.min + " (" + data.allergyStats.stats.outgrown[i].min.total.city + ", " + data.allergyStats.stats.outgrown[i].min.total.state + ")";
                            maxDiv.innerHTML = "Max: " + data.allergyStats.stats.outgrown[i].max.total.max + " (" + data.allergyStats.stats.outgrown[i].max.total.city + ", " + data.allergyStats.stats.outgrown[i].max.total.state + ")";
                            meanDiv.innerHTML = "Mean: " + Math.round(data.allergyStats.stats.outgrown[i].mean.total * 100) / 100;
                        }
                    }

                    break;
                case "percentage":
                    for (let i = 0; i < data.allergyStats.stats.outgrown.length; i++) {
                        if (allergy == data.allergyStats.stats.outgrown[i].allergy) {
                            var min = data.allergyStats.stats.outgrown[i].min.percentage.min*100;
                            var max = data.allergyStats.stats.outgrown[i].max.percentage.max*100;
                            var mean = data.allergyStats.stats.outgrown[i].mean.percentage*100;

                            minDiv.innerHTML = "Min: " + Math.round(min * 100) / 100 + "% (" + data.allergyStats.stats.outgrown[i].min.percentage.city + ", " + data.allergyStats.stats.outgrown[i].min.percentage.state + ")";
                            maxDiv.innerHTML = "Max: " + Math.round(max * 100) / 100 + "% (" + data.allergyStats.stats.outgrown[i].max.percentage.city + ", " + data.allergyStats.stats.outgrown[i].max.percentage.state + ")";
                            meanDiv.innerHTML = "Mean: " + Math.round(mean * 100) / 100 + "%";
                        }
                    }

                    break;
                default:
            }

          break;
        default:
    }
}
