            /* 🏭 LAYER 1: VERIFIED WHOLESALE SUPPLIER DIRECTORY INTERFACE */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
                    <Building className="text-orange-500 h-4 w-4" /> Live Wholesale Listings Catalog
                  </h3>
                  <div className="text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 font-mono leading-relaxed mb-5">
                    📡 <span className="text-orange-400 font-bold uppercase tracking-wider text-[10px]">WMS Node Live:</span> External Warehouse Management System mapped natively. Cross-reference mapping, trade SKU arrays, and algorithmic routing are interlocked. Orders auto-dispatch via priority Hot-Shot courier loops straight to the purchaser's repair bay.
                  </div>
                  <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2.5">Active Mapped Warehouse Inventory Rows:</div>
                  <div className="flex flex-col gap-2.5">
                    {sellerOffers.map(offer => (
                      <div key={offer.id} className="p-3.5 rounded-xl border flex justify-between items-center bg-slate-950/40 border-slate-800/80">
                        <div>
                          <div className="text-xs font-bold text-slate-200">{offer.part}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{offer.id} | Shelf Slot: <span className="text-slate-400 font-semibold">{offer.location}</span></div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-orange-400 font-mono block">${offer.price.toFixed(2)}</span>
                          <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-wider font-mono">Qty: {offer.stock} Avail</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" /> Wholesaler Settlement Metrics
                </h3>
                <div className="p-4 rounded-xl border text-center bg-slate-950/40 border-slate-800 mb-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Settled Payout Vault</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">$4,120.00</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-1 font-mono">Live via Stripe Connect</div>
                </div>
              </div>
            </div>

          ) : user.role === 'DIY' ? (
            
            /* 🚗 LAYER 2: DIY SMART-TERMINAL INTERFACE */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              <div className="rounded-xl border p-4 shadow-md flex flex-col gap-3" style={{ borderColor: C.border, background: C.panel }}>
