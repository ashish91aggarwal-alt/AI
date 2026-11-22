const {Resvg}=require('@resvg/resvg-js');const fs=require('fs');
process.chdir(__dirname);
const V=require('./char_vishnu'),M=require('./char_monty'),B=require('./char_brahma'),SH=require('./char_shani'),SK=require('./char_sakshi');
const CV=require('./cast_vishnu'),CM=require('./cast_monty'),CB=require('./cast_brahma'),CS=require('./cast_shani'),CK=require('./cast_sakshi');
const defs='<defs><radialGradient id="halo"/><radialGradient id="shaniHalo"/></defs>';
const items={monty:M.draw(CM.POSES[0]),sakshi:SK.draw(CK.POSES[0]),vishnu:V.drawSeated({...CV.base,...CV.POSES[0]}),brahma:B.draw({...CB.POSES[0]}),shani:SH.draw({standing:true,...CS.POSES[0]})};
for(const k in items){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="2000" viewBox="0 -80 1080 2000">${defs}${items[k]}</svg>`;fs.writeFileSync('out/m_'+k+'.png',new Resvg(svg).render().asPng());}
