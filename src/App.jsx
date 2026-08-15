                  <p className="text-[10px] text-slate-500 italic mb-3 leading-relaxed">🔒 Onsite catalogue modifications restricted under employee session filters.</p>
                )}

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {inventoryList.map(stock => (
                    <div key={stock.id} className="p-2.5 rounded-lg border flex justify-between items-center text-xs bg-slate-950/40 border-slate-800/80">
                      <div className="truncate pr-2">
                        <div className="font-semibold text-slate-300 truncate">{stock.item}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{stock.id} | Loc: <span className="text-slate-400 font-semibold">{stock.location}</span></div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded font-mono bg-slate-900 border border-slate-700 text-orange-400">×{stock.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTRAL & RIGHT SECTOR COMBO MODULE: ACTIVE INTERACTIVE WORKSPACE CARD MATRIX */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* PRIMARY HIGH-DENSITY GLOBAL CATALOG INTERACTIVE SEARCHBAR */}
              <div className="rounded-xl border p-4 shadow-md flex flex-col sm:flex-row gap-3 items-center" style={{ borderColor: C.border, background: C.panel }}>
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Global Marketplace Catalogue Scan... Search part names, trade SKUs, cross-references or vehicle tags..." className="w-full rounded-xl border pl-11 pr-4 py-3 text-xs text-slate-100 outline-none transition-all focus:border-slate-700" style={{ borderColor: C.border, background: C.panel2 }} />
                </div>
                <button onClick={() => alert(`Searching commercial directories for: ${searchQuery}`)} className="w-full sm:w-auto px-5 py-3 rounded-xl bg-orange-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-orange-400 transition-all shadow-sm">Execute Lookup</button>
              </div>

              {/* CORE INTERACTIVE ACTIVE SHOP JOB CARD LOG LAYOUT CONTAINER GRID */}
              <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-4">
                  <FileText className="h-4 w-4 text-orange-500" /> Synced Shop Floor Active Job Cards ({filteredJobs.length} Record Loaded)
                </h3>
                
                {filteredJobs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 text-center">No active repair cards currently catalogued within this folder directory scope match your search parameters.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredJobs.map(job => (
                      <div key={job.id} className="p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all border-slate-800/80 bg-slate-900/40 hover:border-slate-700/60">
                        <div>
                          <div className="flex justify-between items-center border-b pb-2 mb-2.5" style={{ borderColor: C.border }}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-orange-400">{job.id}</span>
                              <span className="text-[9px] px-2 py-0.5 rounded font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">{job.folder}</span>
                            </div>
                            <span style={{ color: job.status.includes('Verified') ? C.emerald : '#F59E0B', fontSize: '10px' }} className="uppercase tracking-wider font-bold bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/60">{job.status}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-200">{job.customer} <span className="font-mono text-xs font-medium text-slate-500">[{job.rego}]</span></h4>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed"><span className="text-slate-500 font-medium">Active Assignment:</span> {job.currentTask}</p>
                        </div>
                        
                        <div className="mt-5 pt-3 border-t flex gap-2" style={{ borderColor: C.border }}>
                          <button onClick={() => handleCourierScan(job.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-bold text-[10px] bg-slate-800 border border-slate-700 text-slate-300 uppercase tracking-wider hover:bg-slate-700 transition-all">
                            <ScanLine className="h-3.5 w-3.5 text-emerald-400" /> Manifest Ingest
                          </button>
                          <button onClick={() => handleOrderExecution(job.id, `Parts Procurement Order for ${job.customer} Matrix Log`, 285.00)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-bold text-[10px] bg-emerald-600 text-slate-950 uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-sm">
                            <ShoppingCart className="h-3.5 w-3.5" /> {user?.role === 'APPRENTICE' ? 'Route Order' : 'Order Parts'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* REALTIME TRANSACTION CHANNELS & EMPLOYEE ACCOUNTABILITY MONITOR */}
              <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: C.border, background: C.panel }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5" style={{ color: C.emerald }}>
                  <ShieldCheck className="h-4 w-4" /> Live Employee Authorization Routing Streams
                </h3>
                
                {user?.role === 'APPRENTICE' ? (
                  <div className="p-3.5 rounded-xl border text-xs leading-relaxed border-emerald-900/40 bg-emerald-950/10">
                    📡 <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">Employee Link Node Enabled:</span> All digital wholesale procurements, part configuration overrides, and job manifests generated on this device stream directly onto your supervisor's panel for realtime trade and financial authorization checkouts.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    
                    {/* INCOMING APPROVAL TICKETS FOR OWNER TERMINALS */}
                    <div className="flex flex-col gap-2.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Awaiting Owner Intercept:</div>
                      {incomingRequests.length === 0 ? (
                        <p className="text-xs text-slate-500 italic bg-slate-950/30 p-3 rounded-xl border border-slate-900">No active employee checkout orders pending validation. System operational.</p>
                      ) : (
                        incomingRequests.map(req => (
                          <div key={req.id} className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/10 text-xs flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center font-bold text-amber-400 text-[10px] tracking-wider uppercase mb-1.5">
                                <span>⚠️ Authorization Required</span>
                                <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{req.id}</span>
                              </div>
                              <p className="text-slate-200 font-semibold leading-snug">{req.desc}</p>
                              <div className="text-[10px] text-slate-400 mt-2 font-mono flex flex-col gap-0.5 bg-slate-950/30 p-2 rounded border border-slate-800/60">
                                <div>Job Assignment Reference: <span className="text-slate-200 font-bold">{req.jobId}</span></div>
                                <div>Financial Value Clip: <span className="text-orange-400 font-bold">${req.price.toFixed(2)}</span></div>
                                <div className="text-slate-500 mt-1">Operator ID: {req.apprentice} [{req.timestamp}]</div>
                              </div>
                            </div>
                            <div className="mt-3.5 flex gap-2 border-t pt-2.5 border-slate-800/60">
                              <button onClick={() => handleOwnerApproveOrder(req.id, 'APPROVE')} className="flex-1 py-1.5 rounded-lg font-bold text-[10px] uppercase bg-emerald-600 text-slate-950 hover:bg-emerald-500 transition-all flex items-center justify-center gap-0.5 shadow-sm">
                                <Check className="h-3 w-3" /> Approve & Pay
                              </button>
                              <button onClick={() => handleOwnerApproveOrder(req.id, 'DENY')} className="py-1.5 px-3 rounded-lg font-bold text-[10px] uppercase bg-slate-800 text-red-400 border border-slate-700 hover:bg-slate-700 hover:text-red-300 transition-all">
                                <Ban className="h-3 w-3" /> Drop
                              </button>
                            </div>
                          </div>
