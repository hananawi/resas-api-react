import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  LineChart,
  Tooltip,
  XAxis,
  Line,
  YAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import PropTypes from "prop-types";

import "./App.css";

const colors = [
  "#55efc4",
  "#57606f",
  "#74b9ff",
  "#a29bfe",
  "#ffeaa7",
  "#fab1a0",
  "#d63031",
  "#e84393",
];
let p = 0;

function AnimatedLetters(props) {
  const lettersRef = useRef([]);
  const chars = useRef(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-_=+{}|[]\\;':\"<>?,./`~".split(
      ""
    )
  );
  const charsLength = useRef(chars.current.length);
  const duration = useRef(Math.ceil(45 / props.string.length)); // frame, 45frame per epoch
  const count = useRef(0);
  const frameId = useRef(0);
  const timeoutId = useRef(0);
  const done = useRef(0);

  useEffect(() => {
    render();
    return () => {
      window.cancelAnimationFrame(frameId.current);
      clearTimeout(timeoutId.current);
    };
  }, []);

  function render() {
    if (done.current < props.string.length) {
      // lettersRef.current.forEach((val, index) => {
      for (let i = done.current; i < props.string.length; i++) {
        const val = lettersRef.current[i];
        if (count.current < duration.current * (i + 1)) {
          val.textContent =
            chars.current[Math.floor(Math.random() * charsLength.current)];
        } else {
          val.textContent = props.string[i];
          done.current++;
          val.classList.add("done");
        }
      }
      count.current++;
      frameId.current = window.requestAnimationFrame(render);
    } else {
      timeoutId.current = setTimeout(function () {
        done.current = 0;
        count.current = 0;
        lettersRef.current.forEach((val) => {
          val.classList.remove("done");
        });
        frameId.current = window.requestAnimationFrame(render);
      }, 750);
    }
  }

  return (
    <div className="animated-loading">
      {props.string.split("").map((val, index) => (
        <span
          ref={(ref) => (lettersRef.current[index] = ref)}
          key={index}
        ></span>
      ))}
    </div>
  );
}

AnimatedLetters.propTypes = {
  string: PropTypes.string,
};

function CustomizedTooltip(props) {
  const { active, payload } = props;
  if (active && payload && payload.length) {
    return (
      <div>
        <div>年度: {payload[0].payload.year}</div>
        {/* <div>人口数: {payload[0].value}</div> */}
        {payload.map((val) => (
          <div key={val.dataKey}>
            {val.name}: {Number(val.value).toFixed(2)}万
          </div>
        ))}
      </div>
    );
  }

  return null;
}

CustomizedTooltip.propTypes = {
  active: PropTypes.any,
  payload: PropTypes.any,
};

function App() {
  const [cities, setCities] = useState([]);
  const [cityNum, setCityNum] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const population = useRef(null);
  const lineColors = useRef({});

  useEffect(() => {
    population.current = Array(5)
      .fill(null)
      .map((val, index) => ({ year: 1980 + index * 10 }));

    fetch("https://opendata.resas-portal.go.jp/api/v1/prefectures", {
      headers: {
        "X-API-KEY": "epOLO6TaalO2S9aHQ65FcS828O72I5B3WcJidnJf",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        setCities(
          json.result.map((val) => {
            val.checkbox = false;
            return val;
          })
        );
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  function handleCitiesClick(e) {
    if (!("prefcode" in e.target.dataset)) {
      return;
    }
    const prefCode = e.target.dataset.prefcode;
    e.target.classList.toggle("active");
    if (!population.current[0][prefCode]) {
      setIsLoading(true);
      fetch(
        `https://opendata.resas-portal.go.jp/api/v1/population/composition/perYear?cityCode=-&prefCode=${prefCode}`,
        {
          headers: {
            "X-API-KEY": "epOLO6TaalO2S9aHQ65FcS828O72I5B3WcJidnJf",
          },
        }
      )
        .then((res) => res.json())
        .then((json) => {
          for (let i = 0; i < 5; i++) {
            population.current[i][prefCode] =
              json.result.data[0].data[4 + 2 * i].value / 10000;
          }
          setCities((prev) => {
            for (let i = 0; i < prev.length; i++) {
              if (prev[i].prefCode == prefCode) {
                prev[i].checkbox = !prev[i].checkbox;
              }
            }
            return [...prev];
          });
          if (e.target.classList.contains("active")) {
            if (!lineColors.current[prefCode]) {
              lineColors.current[prefCode] = colors[p++ % 8];
            }
            setCityNum((num) => num + 1);
          } else {
            setCityNum((num) => num - 1);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      setCities((prev) => {
        for (let i = 0; i < prev.length; i++) {
          if (prev[i].prefCode == prefCode) {
            prev[i].checkbox = !prev[i].checkbox;
          }
        }
        return [...prev];
      });
    }
  }

  return (
    <div className="my-app">
      <div className="cities" onClick={handleCitiesClick}>
        {cities.map((val) => (
          <div key={val.prefName} data-prefcode={val.prefCode}>
            {val.prefName}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" aspect={1.8}>
        <LineChart
          className={cityNum > 0 && "active"}
          data={population.current}
          margin={{ left: 16, right: 32, top: 16, bottom: 16 }}
        >
          <XAxis dataKey="year" xAxisId={0} name="年度" />
          <YAxis yAxisId={0} unit="万" name="人口数" />
          <Tooltip content={<CustomizedTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ right: 0 }}
            layout="vertical"
          />
          <CartesianGrid stroke="#f5f5f5" />
          {/* <Line type="monotone" dataKey="x-value" stroke="#ff7300" xAxisId={0} yAxisId={0} />
          <Line type="monotone" dataKey="y-value" stroke="#387908" xAxisId={0} yAxisId={0} />
          <Line type="monotone" dataKey="33" stroke="#000" xAxisId={0} yAxisId={0} /> */}
          {cities.map((val) => {
            if (!val.checkbox) {
              return null;
            }
            return (
              <Line
                key={val.prefCode}
                type="monotone"
                name={val.prefName}
                dataKey={val.prefCode}
                stroke={lineColors.current[val.prefCode]}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      {isLoading && (
        <div className="animated-loading-wrapper">
          <AnimatedLetters string="LOADING..." />
        </div>
      )}
    </div>
  );
}

export default App;
