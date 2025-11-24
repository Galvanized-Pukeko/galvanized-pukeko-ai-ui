# Charts tool

New components to render charts packages/client/src/components/PkBarChart.vue and packages/client/src/components/PkPieChart.vue
were recently introduced to add support of charts. 

- In packages/server-js/src/server.ts introduce a new tool pk_charts
- You may modify packages/client/src/components/PkPieChart.vue or packages/client/src/components/PkBarChart.vue if necessary, just don't forget to update packages/client/src/KitchenSink.vue. 
- tool should accept a chart type, let's start from bar and pie
- tool should accept title
- tool should accept data and labels
- do not expect colours, apply them randomly from a predefined palette
- modify packages/client/src/App.vue to render components