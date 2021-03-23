const mongoose = require('mongoose');
const Analysis = mongoose.model('Analysis');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'out.csv',
  header: [
    {id: 'name', title: 'Name'},
    {id: 'surname', title: 'Surname'},
    {id: 'age', title: 'Age'},
    {id: 'gender', title: 'Gender'},
  ]
});
module.exports = (req, res, next) => 
{
Analysis.findOne({
  'sha256': req.params.hash
}, function (err, analysis) {
  if (err) throw err;
  if(analysis.state != 4) return res.end("Analysis not completed, report cannot be generated!");

  let batteryArray = [];
  for(let i = 0; i < analysis.batteryCSV[0].length; i++){
    let key = analysis.batteryCSV[0][i];
    let val = analysis.batteryCSV[1][i];
    batteryArray.push([key, val]);
  }
  if(batteryArray.length == 0){
    batteryArray.push(["No results", "No results"])
  }

  let intentArray = [];
  for(let i = 0; i < analysis.intentCSV[0].length; i++){
    let key = analysis.intentCSV[0][i];
    let val = analysis.intentCSV[1][i];

    const splitStr = key.split("\""); //TODO: ew
    if(splitStr.length > 1){
      key = splitStr[1];
    }
    intentArray.push([key, val]);
  }
  if(intentArray.length == 0){
    intentArray.push(["No results", "No results"])
  }

  let permissionArray = [];
  for(let i = 0; i < analysis.permCSV[0].length; i++){
    let key = analysis.permCSV[0][i];
    let val = analysis.permCSV[1][i];
    permissionArray.push([key, val]);
  }
  if(permissionArray.length == 0){
    permissionArray.push(["No results", "No results"])
  }
  const data = [
    {
      name: intentArray,
      surname: 'Snow',
      age: 26,
      gender: 'M'
    }, {
      name: 'Clair',
      surname: 'White',
      age: 33,
      gender: 'F',
    }, {
      name: 'Fancy',
      surname: 'Brown',
      age: 78,
      gender: 'F'
    }
  ]
});



csvWriter
  .writeRecords(data)
  .end();
}