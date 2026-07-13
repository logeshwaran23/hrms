const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBADF') filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walkSync('/Users/logeshwaranselvam/Documents/hrms/server/src/modules');

files.filter(f => f.endsWith('.ts')).forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // req.params.something -> (req.params.something as string)
  // Wait, better to just cast the occurrences found in the TS errors
  
  // Specific fixes based on the TS errors
  content = content.replace(/req\.params\.id(?!\s*as)/g, '(req.params.id as string)');
  content = content.replace(/req\.query\.([^ \)\}\]]+)(?!\s*as)/g, '(req.query.$1 as string)');
  content = content.replace(/req\.user!\.employeeId(?!\s*as)/g, '(req.user!.employeeId as string)');
  content = content.replace(/req\.user!\.roleName(?!\s*as)/g, '(req.user!.roleName as string)');

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed types in modules');
