
class MiniChart{
  constructor(ctx){ this.ctx=ctx; this.data=[]; this.labels=[]; }
  render(){
    const c=this.ctx.canvas, w=c.width=c.clientWidth, h=c.height=340;
    const ctx=this.ctx; ctx.clearRect(0,0,w,h);
    ctx.strokeStyle="#87f3c5"; ctx.lineWidth=2; ctx.fillStyle="#9fb4ad"; ctx.font="14px system-ui";
    const vals=this.data.filter(v=>typeof v==='number');
    if(vals.length<2){ ctx.fillText("Нужни са поне 2 точки", 10, 24); return; }
    const min=Math.min(...vals), max=Math.max(...vals), pad=24;
    ctx.beginPath();
    this.data.forEach((v,i)=>{
      const x=pad + (w-2*pad)*(i/(this.data.length-1));
      const y=h-pad - ( (v-min) / ((max-min)||1) )*(h-2*pad);
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    });
    ctx.stroke();
  }
}
window.MiniChart=MiniChart;
