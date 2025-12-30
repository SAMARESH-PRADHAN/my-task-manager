import XLSX from "xlsx";
export function exportExcel(data,name,res){
 const ws=XLSX.utils.json_to_sheet(data);
 const wb=XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb,ws,"Data");
 const buf=XLSX.write(wb,{type:"buffer",bookType:"xlsx"});
 res.setHeader("Content-Disposition",`attachment; filename=${name}.xlsx`);
 res.send(buf);
}