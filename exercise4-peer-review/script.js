const CSV_PATH = "./data.csv";

(async function main() {
  const raw = await d3.csv(CSV_PATH, d3.autoType);

  const data = raw
    .map((d) => ({
      Year: d.Year,
      Wheat: d.Wheat,
      Wages: d.Wages == null || d.Wages === "" ? null : d.Wages,
    }))
    .filter((d) => d.Year != null && d.Wheat != null)
    .sort((a, b) => a.Year - b.Year);

  renderPlayfairReproduction(data);
  renderFigure2DualAxes(data);
  renderFigure3PurchasingPower(data);
})().catch((err) => {
  console.error(err);
  alert("Failed to load CSV. If you're opening index.html directly, use a local server (e.g., VSCode Live Server).");
});

function renderPlayfairReproduction(data) {
  const svg = d3.select("#chart");
  svg.selectAll("*").remove();

  const W = 1100,
    H = 560;
  const margin = { top: 26, right: 26, bottom: 54, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.Year))
    .range([0, innerW])
    .paddingInner(0.18)
    .paddingOuter(0.06);

  const maxY = d3.max(data, (d) => {
    const w = d.Wheat ?? 0;
    const s = d.Wages == null ? 0 : d.Wages;
    return Math.max(w, s);
  });

  const y = d3.scaleLinear().domain([0, maxY]).nice().range([innerH, 0]);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(8).tickSize(-innerW).tickFormat(""))
    .call((sel) => sel.selectAll(".tick line").attr("shape-rendering", "crispEdges"));

  const startYear = data[0].Year;
  const xAxis = d3
    .axisBottom(x)
    .tickValues(x.domain().filter((yr) => (yr - startYear) % 25 === 0 || yr === data[data.length - 1].Year))
    .tickFormat(d3.format("d"));

  const yAxis = d3.axisLeft(y).ticks(8);

  g.append("g").attr("class", "axis").call(yAxis);

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(xAxis)
    .call((sel) => sel.selectAll("text").attr("dy", "1.0em"));

  g.append("text").attr("class", "label").attr("x", -48).attr("y", -10).attr("text-anchor", "start").text("Shillings");

  g.append("text")
    .attr("class", "label")
    .attr("x", innerW / 2)
    .attr("y", innerH + 44)
    .attr("text-anchor", "middle")
    .text("Year");

  const wageData = data.filter((d) => d.Wages != null);
  const xCenter = (yr) => x(yr) + x.bandwidth() / 2;

  const area = d3
    .area()
    .x((d) => xCenter(d.Year))
    .y0(y(0))
    .y1((d) => y(d.Wages))
    .curve(d3.curveMonotoneX);

  const line = d3
    .line()
    .x((d) => xCenter(d.Year))
    .y((d) => y(d.Wages))
    .curve(d3.curveMonotoneX);

  g.append("path").datum(wageData).attr("d", area).attr("fill", "var(--area)");

  g.append("path").datum(wageData).attr("d", line).attr("fill", "none").attr("stroke", "var(--line)").attr("stroke-width", 3.25);

  g.append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (d) => x(d.Year))
    .attr("y", (d) => y(d.Wheat))
    .attr("width", x.bandwidth())
    .attr("height", (d) => y(0) - y(d.Wheat))
    .attr("fill", "var(--bar)")
    .attr("stroke", "var(--outline)")
    .attr("stroke-width", 1);

  const tooltip = document.getElementById("tooltip");

  const overlay = g.append("rect").attr("x", 0).attr("y", 0).attr("width", innerW).attr("height", innerH).attr("fill", "transparent");

  const years = data.map((d) => d.Year);

  overlay
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const idx = Math.max(0, Math.min(years.length - 1, Math.round(mx / (innerW / years.length))));
      const d = data[idx];

      const wageText = d.Wages == null ? "<span class='muted'>missing</span>" : d.Wages.toFixed(2);

      tooltip.innerHTML = `
        <b>${d.Year}</b><br/>
        Wheat: <b>${d.Wheat.toFixed(1)}</b> <span class="muted">shillings/quarter</span><br/>
        Wages: <b>${wageText}</b> <span class="muted">shillings/week</span>
      `;
      tooltip.style.left = event.clientX + "px";
      tooltip.style.top = event.clientY + "px";
      tooltip.style.opacity = 1;
    })
    .on("mouseleave", () => {
      tooltip.style.opacity = 0;
    });
}

function renderFigure2DualAxes(data) {
  const svg = d3.select("#chart2");
  svg.selectAll("*").remove();

  const W = 1100,
    H = 560;
  const margin = { top: 26, right: 80, bottom: 54, left: 80 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.Year))
    .range([0, innerW])
    .paddingInner(0.18)
    .paddingOuter(0.06);

  const maxWheat = d3.max(data, (d) => d.Wheat ?? 0);
  const yLeft = d3.scaleLinear().domain([0, maxWheat]).nice().range([innerH, 0]);

  const wageData = data.filter((d) => d.Wages != null);
  const maxWages = d3.max(wageData, (d) => d.Wages ?? 0);
  const yRight = d3.scaleLinear().domain([0, maxWages]).nice().range([innerH, 0]);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(yLeft).ticks(8).tickSize(-innerW).tickFormat(""))
    .call((sel) => sel.selectAll(".tick line").attr("shape-rendering", "crispEdges"));

  const startYear = data[0].Year;
  const xAxis = d3
    .axisBottom(x)
    .tickValues(x.domain().filter((yr) => (yr - startYear) % 25 === 0 || yr === data[data.length - 1].Year))
    .tickFormat(d3.format("d"));

  g.append("g").attr("class", "axis").call(d3.axisLeft(yLeft).ticks(8));

  g.append("g").attr("class", "axis").attr("transform", `translate(${innerW},0)`).call(d3.axisRight(yRight).ticks(8));

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(xAxis)
    .call((sel) => sel.selectAll("text").attr("dy", "1.0em"));

  g.append("text").attr("class", "label").attr("x", -70).attr("y", -10).attr("text-anchor", "start").text("Wheat price (shillings / quarter)");

  g.append("text")
    .attr("class", "label")
    .attr("x", innerW - 50)
    .attr("y", -10)
    .attr("text-anchor", "start")
    .text("Wages (shillings / week)");

  g.append("text")
    .attr("class", "label")
    .attr("x", innerW / 2)
    .attr("y", innerH + 44)
    .attr("text-anchor", "middle")
    .text("Year");

  g.append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (d) => x(d.Year))
    .attr("y", (d) => yLeft(d.Wheat))
    .attr("width", x.bandwidth())
    .attr("height", (d) => yLeft(0) - yLeft(d.Wheat))
    .attr("fill", "var(--bar)")
    .attr("stroke", "var(--outline)")
    .attr("stroke-width", 1);

  const xCenter = (yr) => x(yr) + x.bandwidth() / 2;

  const wageLine = d3
    .line()
    .defined((d) => d.Wages != null)
    .x((d) => xCenter(d.Year))
    .y((d) => yRight(d.Wages))
    .curve(d3.curveMonotoneX);

  g.append("path").datum(data).attr("d", wageLine).attr("fill", "none").attr("stroke", "var(--line)").attr("stroke-width", 3.0);

  g.append("g")
    .selectAll("circle")
    .data(wageData)
    .join("circle")
    .attr("cx", (d) => xCenter(d.Year))
    .attr("cy", (d) => yRight(d.Wages))
    .attr("r", 2.2);

  const tooltip = document.getElementById("tooltip");

  const overlay = g.append("rect").attr("x", 0).attr("y", 0).attr("width", innerW).attr("height", innerH).attr("fill", "transparent");

  const years = data.map((d) => d.Year);

  overlay
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const idx = Math.max(0, Math.min(years.length - 1, Math.round(mx / (innerW / years.length))));
      const d = data[idx];

      const wageText = d.Wages == null ? "<span class='muted'>missing</span>" : d.Wages.toFixed(2);

      tooltip.innerHTML = `
        <b>${d.Year}</b><br/>
        Wheat: <b>${d.Wheat.toFixed(1)}</b> <span class="muted">shillings/quarter</span><br/>
        Wages: <b>${wageText}</b> <span class="muted">shillings/week</span>
      `;
      tooltip.style.left = event.clientX + "px";
      tooltip.style.top = event.clientY + "px";
      tooltip.style.opacity = 1;
    })
    .on("mouseleave", () => {
      tooltip.style.opacity = 0;
    });
}

function renderFigure3PurchasingPower(data) {
  const svg = d3.select("#chart3");
  svg.selectAll("*").remove();

  const W = 1100,
    H = 560;
  const margin = { top: 26, right: 26, bottom: 54, left: 90 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const pp = data
    .filter((d) => d.Wages != null && d.Wheat != null && d.Wheat !== 0)
    .map((d) => ({
      Year: d.Year,
      Wheat: d.Wheat,
      Wages: d.Wages,
      PP_quarters: d.Wages / d.Wheat,
      PP_kg: (d.Wages / d.Wheat) * 6.8,
    }))
    .sort((a, b) => a.Year - b.Year);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(pp, (d) => d.Year))
    .range([0, innerW]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(pp, (d) => d.PP_quarters)])
    .nice()
    .range([innerH, 0]);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(8).tickSize(-innerW).tickFormat(""))
    .call((sel) => sel.selectAll(".tick line").attr("shape-rendering", "crispEdges"));

  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(8));

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")));

  g.append("text").attr("class", "label").attr("x", -70).attr("y", -10).attr("text-anchor", "start").text("Purchasing power (quarters/week)");

  g.append("text")
    .attr("class", "label")
    .attr("x", innerW / 2)
    .attr("y", innerH + 44)
    .attr("text-anchor", "middle")
    .text("Year");

  const line = d3
    .line()
    .x((d) => x(d.Year))
    .y((d) => y(d.PP_quarters))
    .curve(d3.curveMonotoneX);

  const area = d3
    .area()
    .x((d) => x(d.Year))
    .y0(y(0))
    .y1((d) => y(d.PP_quarters))
    .curve(d3.curveMonotoneX);

  g.append("path").datum(pp).attr("d", area).attr("fill", "rgba(120, 220, 140, 0.18)");

  g.append("path").datum(pp).attr("d", line).attr("fill", "none").attr("stroke", "rgba(120, 220, 140, 1)").attr("stroke-width", 3);

  g.append("g")
    .selectAll("circle")
    .data(pp)
    .join("circle")
    .attr("cx", (d) => x(d.Year))
    .attr("cy", (d) => y(d.PP_quarters))
    .attr("r", 2.4)
    .attr("fill", "rgba(120, 220, 140, 1)");

  const tooltip = document.getElementById("tooltip");

  const bisectYear = d3.bisector((d) => d.Year).left;

  g.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", "transparent")
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const yr = x.invert(mx);

      const i = bisectYear(pp, yr);
      const a = pp[Math.max(0, i - 1)];
      const b = pp[Math.min(pp.length - 1, i)];
      const d = !a ? b : !b ? a : Math.abs(a.Year - yr) < Math.abs(b.Year - yr) ? a : b;

      tooltip.innerHTML = `
        <b>${d.Year}</b><br/>
        Wheat: <b>${d.Wheat.toFixed(1)}</b> <span class="muted">shillings/quarter</span><br/>
        Wages: <b>${d.Wages.toFixed(2)}</b> <span class="muted">shillings/week</span><br/>
        Purchasing power: <b>${d.PP_quarters.toFixed(3)}</b> <span class="muted">quarters/week</span><br/>
        (<b>${d.PP_kg.toFixed(2)}</b> <span class="muted">kg/week</span>)
      `;
      tooltip.style.left = event.clientX + "px";
      tooltip.style.top = event.clientY + "px";
      tooltip.style.opacity = 1;
    })
    .on("mouseleave", () => {
      tooltip.style.opacity = 0;
    });

  const lastYear = d3.max(pp, (d) => d.Year);
  g.append("text")
    .attr("class", "label")
    .attr("x", x(lastYear))
    .attr("y", innerH - 6)
    .attr("text-anchor", "end");
}
