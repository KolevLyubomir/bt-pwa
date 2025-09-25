class MiniChart{
  constructor(ctx){ this.ctx=ctx; this.data=[]; }
  render(){
    const c=this.ctx.canvas, w=c.width=c.clientWidth, h=c.height=320;
    const ctx=this.ctx; ctx.clearRect(0,0,w,h);
    const vals=this.data.filter(v=>typeof v==='number');
    ctx.fillStyle="#9fb4ad"; ctx.font="14px system-ui";
    if(vals.length<2){ ctx.fillText("Добави поне 2 записа за графика", 10, 24); return; }
    const min=Math.min(...vals), max=Math.max(...vals), pad=24;
    ctx.strokeStyle="#87f3c5"; ctx.lineWidth=2; ctx.beginPath();
    this.data.forEach((v,i)=>{
      const x=pad + (w-2*pad)*(i/(this.data.length-1));
      const y=h-pad - ((v-min)/((max-min)||1))*(h-2*pad);
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    });
    ctx.stroke();
  }
}
window.MiniChart=MiniChart;
