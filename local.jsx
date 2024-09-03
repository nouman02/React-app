import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import merge from "merge";
import titleize from "titleize";

import { Pie } from "react-chartjs-2";
import { Bar, HorizontalBar } from "react-chartjs-2";
import "chartjs-plugin-labels";

import withTheme from "../../hoc/with_theme";
import viz from "../../lib/viz";
import inflections from "../../lib/inflections";
import Indicator from "../indicator";

const fill = (data, granularity, emptyValue) => {
  if (!data.values || !data.values[0] || !data.values[0].x) {
    return data;
  }

  let granularities = {
    week: i => {
      return Number(
        moment
          .utc()
          .subtract(i, "weeks")
          .startOf("week")
          .add(1, "day")
          .format("x")
      );
    }
  };

  let slots = {};
  let i = 0;

  // Create zeros
  for (i = 0; i < 14; i += 1) {
    let x = granularities[granularity](i);
    let y = emptyValue;

    slots[x] = { x: x, y: y };
  }

  // Replace zeros with values
  data.values.forEach(value => {
    if (slots[value.x]) {
      slots[value.x].y = value.y;
    } else if (value.x > 0) {
      console.error("no filler slot for " + value.x);
    }
  });

  data.values = Object.values(slots);

  return data;
};

const LocalHorizontalMinibar = withTheme(props => {
  const labels = props.data.map(r => r.x);
  const values = props.data.map(r => r.y);

  const data = {
    labels: labels,
    datasets: [
      {
        data: values,
        borderColor: "#777",
        borderWidth: 0,
        backgroundColor: [
          props.theme.palette.spectrum.orange,
          props.theme.palette.spectrum.darkTeal,
          props.theme.palette.spectrum.teal,
          props.theme.palette.spectrum.green,
        ]
      }
    ]
  };

  const options = {
    legend: {
      display: false,
      position: "right"
    },
    layout: {
      padding: {
        bottom: 0
      }
    },
    maintainAspectRatio: false,
    plugins: {
      labels: {
        render: args => {
          return (
            args.label +
            "\n" +
            inflections.format(args.value, args.dataset.labelFormat || {})
          );
        },
        fontColor: "#fff",
        fontFamily:
          '"Open Sans", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        fontSize: 14,
        fontStyle: "bold"
      }
    },
    scales: {
      yAxes: [
        {
          barPercentage: 1,
          gridLines: {
            display: false,
            drawBorder: false
          },
          ticks: {
            display: true,
            beginAtZero: true,
            min: 0
          }
        }
      ],
      xAxes: [
        {
          gridLines: {
            display: false,
            drawBorder: true
          },
          ticks: {
            display: true,
            maxRotation: 0,
            minRotation: 0,
            callback: function(value) {
              return inflections.format(value, {});
            }
          }
        }
      ]
    }
  };

  return <HorizontalBar height={props.height} data={data} options={options} />;
});

const LocalPie = withTheme(props => {
  const labels = props.data.map(r => r.x);
  const values = props.data.map(r => r.y);

  const data = {
    labels: labels,
    datasets: [
      {
        data: values,
        borderColor: "#777",
        borderWidth: 0,
        backgroundColor: [
          props.theme.palette.spectrum.green,
          props.theme.palette.spectrum.teal,
          props.theme.palette.spectrum.darkTeal
        ]
      }
    ]
  };

  const options = {
    legend: {
      display: false,
      position: "right"
    },
    maintainAspectRatio: false,
    cutoutPercentage: 0,
    plugins: {
      labels: {
        render: args => {
          return (
            args.label +
            "\n" +
            inflections.format(args.value, args.dataset.labelFormat || {})
          );
        },
        fontColor: "#fff",
        fontFamily:
          '"Open Sans", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        fontSize: 14,
        fontStyle: "bold"
      }
    }
  };

  return <Pie height={props.height} data={data} options={options} />;
});

const LocalTimeSeriesLine = withTheme(props => {
  const tooltips = {
    mode: "index",
    intersect: false,
    borderWidth: 0,
    caretSize: 0,
    callbacks: {
      title: points => {
        return (
          {
            week: "Week of "
          }[props.granularity] + data.labels[points[0].index]
        );
      },
      label: (tooltipItem, data) => {
        const dataset = data.datasets[tooltipItem.datasetIndex];
        const value = tooltipItem.yLabel;

        return (
          dataset.label + ": " + inflections.format(value, dataset.labelFormat)
        );
      },
      labelColor: (tooltipItem, chart) => {
        const i = tooltipItem.datasetIndex;
        const dataset = chart.config.data.datasets[i];
        const color = dataset.borderColor || dataset.backgroundColor;

        return {
          borderColor: color,
          backgroundColor: color,
          multiKeyBackground: "transparent"
        };
      }
    }
  };

  const hover = {
    mode: "nearest",
    intersect: true
  };

  const labelSource = props.data[0] ? props.data[0].values : [];

  const data = {
    labels: labelSource.map(r => {
      return moment(r.x).format(props.labelTimestampFormat);
    }),
    datasets: props.data.map((dataset, i) => {
      let config = {
        backgroundColor: props.theme.palette.charts[i],
        borderColor: props.theme.palette.charts[i],
        data: dataset.values.map(r => ({ t: r.x, y: r.y })),
        fill: false,
        label: titleize(dataset.key),
        pointRadius: 0,
        type: "line",
        tooltips: tooltips,
        hover: hover,
        lineTension: 0,
        labelFormat: {
          type: "raw"
        }
      };

      // Merge in overrides specified in the 'datasets' prop
      if (props.datasets[i]) {
        config = merge(config, props.datasets[i]);
      }

      return config;
    })
  };

  const options = {
    bar: {
      barPercentage: 0.2
    },
    legend: {
      position: "top",
      labels: {
        boxWidth: 15,
        usePointStyle: false
      }
    },
    layout: {
      padding: {
        right: 10
        //   left: 0
      }
    },
    plugins: {
      filler: {
        propagate: true
      },
      labels: {
        render: () => ""
      }
    },
    scales: {
      yAxes: (props.yAxes.length > 0 ? props.yAxes : props.data).map(
        (axis, i) => {
          let config = {
            gridLines: {
              display: false,
              drawBorder: false,
              drawTicks: false
            },
            ticks: {
              display: false,
              mirror: true
            }
          };

          // Merge in overrides specified in the 'yAxes' prop
          if (props.yAxes[i]) {
            config = merge(config, props.yAxes[i]);
          }

          return config;
        }
      ),
      xAxes: (props.xAxes.length > 0 ? props.xAxes : [{}]).map(axis => {
        return merge(
          {
            type: "time",
            time: {
              unit: "day",
              min: props.since,
              displayFormats: {
                day: "M/DD"
              }
            },
            distribution: "series",
            gridLines: {
              display: false
            },
            barThickness: 10,
            ticks: {
              source: "data",
              maxRotation: 90,
              minRotation: 90
            }
          },
          axis
        );
      })
    },
    maintainAspectRatio: false,
    showTooltips: true,
    tooltips: tooltips,
    hover: hover
  };

  return <Bar height={props.height} data={data} options={options} />;
});

LocalTimeSeriesLine.propTypes = {
  labelTimestampFormat: PropTypes.string,
  since: PropTypes.object,
  until: PropTypes.object
};

LocalTimeSeriesLine.defaultProps = {
  labelTimestampFormat: "M/D",
  since: null,
  now: null
};

const LocalPeriodComparisonMinibar = withTheme(props => {
  let previousValue = 0;
  let currentValue = 0;

  if (props.data[0] && props.data[0].values) {
    previousValue = props.data[0].values.reduce((t, v) => {
      return t + v.y;
    }, 0);
  }

  if (props.data[1] && props.data[1].values) {
    currentValue = props.data[1].values.reduce((t, v) => {
      return t + v.y;
    }, 0);
  }

  const data = {
    labels: ["Previous 30 Days", "Last 30 Days"],
    datasets: [
      {
        backgroundColor: [
          props.theme.palette.spectrum.teal,
          props.theme.palette.spectrum.darkTeal
        ], // teal
        borderColor: "transparent",
        minBarLength: 5,
        borderWidth: 0,
        data: [previousValue, currentValue]
      }
    ]
  };

  const options = {
    bar: {},
    maintainAspectRatio: false,
    legend: {
      display: false
    },
    plugins: {
      labels: {
        render: () => {}
      }
    },
    layout: {
      padding: {
        bottom: 40
      }
    },
    tooltips: {
      callbacks: {
        label: tooltipItem => {
          return inflections.format(tooltipItem.yLabel, props.labelFormat);
        }
      }
    },
    scales: {
      yAxes: [
        {
          barPercentage: 1,
          gridLines: {
            display: false,
            drawBorder: false
          },
          ticks: {
            display: false,
            beginAtZero: true,
            min: 0
          }
        }
      ],
      xAxes: [
        {
          gridLines: {
            display: false,
            drawBorder: true
          },
          ticks: {
            display: false,
            maxRotation: 0,
            minRotation: 0
          }
        }
      ]
    }
  };

  return (
    <div style={{ height: props.height }}>
      <Bar data={data} height={props.height} options={options} />
    </div>
  );
});

const Local = class extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      errorMessage: this.props.errorMessage,
      loading: true,
      data: null
    };
  }

  async componentDidMount() {
    this.mounted = true;

    // Quick sanity check
    if (!Array.isArray(this.props.data)) {
      throw new Error(
        'Visualization "' +
          this.props.name +
          '" missing data prop, which is require for local rendering.'
      );
    }

    // Retrieve all data in parallel
    await Promise.all(
      this.props.data.map(async d => {
        // Obtain data from viz server
        if (d.url) {
          return await viz(d.url);
        }

        // Short-hand non-temporal dataset (array of values)
        else if (!d.data) {
          return {
            data: [
              {
                values: d.map((y, x) => {
                  return { y: y, x: x };
                })
              }
            ]
          };
        }

        // Static data
        else {
          return d;
        }
      })
    )

      // Merge data objects into a single array
      .then(responses => {
        let data = [];

        // Scenario: no data for entire dataset, defined placeholders
        if (
          responses.length === 1 &&
          responses[0].noData &&
          this.props.placeholders.length > 0
        ) {
          data = this.props.placeholders;
        } else {
          data = responses.reduce((m, r, i) => {
            if (r.noData && this.props.placeholders[i]) {
              return m.concat(this.props.placeholders[i]);
            } else if (r.noData) {
              return m.concat([{ key: "", values: [] }]);
            } else {
              return m.concat(r.data);
            }
          }, []);
        }

        if (this.mounted) {
          this.setState({
            loading: false,
            data: this.props.prepare(
              data.map((series, i) => {
                let dataset = this.props.datasets[i] || {};

                if (dataset.backfill === "none") {
                  return series;
                } else {
                  return fill(series, this.props.granularity, 0);
                }
              })
            )
          });
        }
      })
      // Display friendly error message
      .catch(e => {
        console.error(
          'Visualization "' + this.props.name + '" failed data retrieval.'
        );

        if (e.code && !this.state.errorMessage && this.mounted) {
          this.setState({
            loading: false,
            errorMessage: e.code ? e.message : "Unable to retrieve chart data."
          });
        }

        return [];
      });
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  render() {
    if (this.state.errorMessage) {
      return <p>{this.state.errorMessage}</p>;
    }
    if (this.state.loading) {
      return <Indicator type="bar" />;
    } else if (this.props.type === "pie") {
      return (
        <LocalPie
          {...this.props}
          data={this.state.data}
          response={this.state.response}
        />
      );
    } else if (this.props.type === "horizontal-minibar") {
      return (
        <LocalHorizontalMinibar
          {...this.props}
          data={this.state.data}
          response={this.state.response}
        />
      );
    } else if (this.props.type === "time-series-line") {
      return (
        <LocalTimeSeriesLine
          {...this.props}
          data={this.state.data}
          response={this.state.response}
        />
      );
    } else if (this.props.type === "period-comparison-minibar") {
      return (
        <LocalPeriodComparisonMinibar
          {...this.props}
          data={this.state.data}
          response={this.state.response}
        />
      );
    } else {
      return <span>a {this.props.type} chart</span>;
    }
  }
};

Local.propTypes = {
  data: PropTypes.array,
  datasets: PropTypes.array,
  errorMessage: PropTypes.string,
  labelFormat: PropTypes.object,
  name: PropTypes.string,
  placeholders: PropTypes.array,
  prepare: PropTypes.func,
  type: PropTypes.oneOf([
    "horizontal-minibar",
    "period-comparison-minibar",
    "pie",
    "time-series-line",
  ]).isRequired,
  yAxes: PropTypes.array,
  xAxes: PropTypes.array,
  granularity: PropTypes.string
};

Local.defaultProps = {
  data: [],
  datasets: [],
  errorMessage: null,
  name: "Untitled",
  placeholders: [],
  prepare: data => {
    return data;
  },
  xAxes: [],
  yAxes: [],
  granularity: "week"
};

export default Local;
