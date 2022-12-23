// https://observablehq.com/@nobodyzxc/radial-tidy-tree@182
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Radial Tidy Tree

D3’s [tree layout](https://github.com/d3/d3-hierarchy/blob/master/README.md#tree) implements the [Reingold–Tilford “tidy” algorithm](http://reingold.co/tidier-drawings.pdf) for constructing hierarchical node-link diagrams, improved to run in linear time by [Buchheim *et al.*](http://dirk.jivas.de/papers/buchheim02improving.pdf) Tidy trees are typically more compact than [cluster dendrograms](/@d3/radial-dendrogram), which place all leaves at the same level. See also the [Cartesian variant](/@d3/tidy-tree).`
)});
  main.variable(observer("chart")).define("chart", ["tree","data","d3","autoBox"], function*(tree,data,d3,autoBox)
{
  const root = tree(data);

  const svg = d3.create("svg")
      .style("max-width", "100%")
      .style("height", "auto")
      .style("font", "10px sans-serif")
      .style("margin", "5px");

  const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .join("path")
      .attr("d", d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y));

  const node = svg.append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
    .selectAll("g")
    .data(root.descendants().reverse())
    .join("g")
      .attr("transform", d => `
        rotate(${d.x * 180 / Math.PI - 90})
        translate(${d.y},0)
      `);

  node.append("circle")
      .attr("fill", d => d.children ? "#555" : "#999")
      .attr("r", 2.5);

  node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
      .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
      .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
      .text(d => d.data.name)
      .style("font-size", d => String(d.data.value ? (15 + 50 * d.data.value / 100) : 30) + "px")
    .clone(true).lower()
      .attr("stroke", "white");

  yield svg.node();

  svg.attr("viewBox", autoBox);
}
);
  main.variable(observer("autoBox")).define("autoBox", function(){return(
function autoBox() {
  const {x, y, width, height} = this.getBBox();
  return [x, y, width, height];
}
)});
  main.variable(observer("data")).define("data", ["d3"], function(d3){return(
d3.json("/files/skill.json")
)});
  main.variable(observer("tree")).define("tree", ["d3","radius"], function(d3,radius){return(
data => d3.tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)
  (d3.hierarchy(data))
)});
  main.variable(observer("width")).define("width", function(){return(
932
)});
  main.variable(observer("radius")).define("radius", ["width"], function(width){return(
width / 2
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5")
)});
  return main;
}
