import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  RotateCcw, 
  Star, 
  Receipt, 
  Phone, 
  MessageSquare, 
  MapPin, 
  IndianRupee, 
  BadgeCheck, 
  FileText, 
  Printer, 
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { DirectBooking, WorkerProfile, UserRole, Language } from '../types';
import { getCategoryLabel } from '../data/translations';
import { getCategory3DIcon } from '../data/categoryIcons';

interface ServiceHistoryViewProps {
  currentRole: UserRole;
  currentLanguage: Language;
  bookings: DirectBooking[];
  workersList: WorkerProfile[];
  onBookAgain: (worker: WorkerProfile) => void;
  onCallWorker: (worker: WorkerProfile) => void;
  onChatWorker: (worker: WorkerProfile) => void;
  onRateWorker?: (booking: DirectBooking, worker: WorkerProfile) => void;
  onOpenLiveTracker?: (booking: DirectBooking) => void;
}

export const ServiceHistoryView: React.FC<ServiceHistoryViewProps> = ({
  currentRole,
  currentLanguage,
  bookings,
  workersList,
  onBookAgain,
  onCallWorker,
  onChatWorker,
  onRateWorker,
  onOpenLiveTracker,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'in_progress' | 'cancelled'>('all');
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<DirectBooking | null>(null);

  // Groupings for Customer
  const inProgressBookings = bookings.filter(b => b.status === 'in_transit' || b.status === 'accepted' || b.status === 'work_started' || b.status === 'searching');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  // Filtered list based on active pill
  const displayedBookings = bookings.filter(b => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'completed') return b.status === 'completed';
    if (activeFilter === 'cancelled') return b.status === 'cancelled';
    if (activeFilter === 'in_progress') {
      return b.status === 'in_transit' || b.status === 'accepted' || b.status === 'work_started' || b.status === 'searching';
    }
    return true;
  });

  // Calculations for Worker Role
  const workerCompletedJobs = completedBookings;
  const workerTotalEarned = workerCompletedJobs.reduce((sum, b) => {
    const amount = b.totalPaidAmount || b.quote?.totalAmount || 850;
    return sum + amount;
  }, 0);

  const workerReviews = workerCompletedJobs.filter(b => b.rating || b.review);
  const workerAvgRating = workerReviews.length > 0
    ? (workerReviews.reduce((sum, b) => sum + (b.rating || b.review?.stars || 5), 0) / workerReviews.length).toFixed(1)
    : '5.0';

  // Generate / Download Printable Invoice HTML
  const handlePrintOrDownloadInvoice = (booking: DirectBooking) => {
    const workerObj = workersList.find(w => w.id === booking.workerId);
    const invoiceNo = booking.invoiceNumber || `GKE-INV-${booking.id.slice(-6).toUpperCase()}`;
    const amount = booking.totalPaidAmount || booking.quote?.totalAmount || 750;
    const bookingDateStr = booking.bookingDate || 'Recent Date';
    const completionDateStr = booking.completedAtDate || booking.serviceFinishedAt || 'Completed on Site';

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GharKaExpert Tax Invoice - ${invoiceNo}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #1e293b; max-width: 650px; margin: 0 auto; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
          .logo { font-size: 22px; font-weight: 900; color: #1d4ed8; text-transform: uppercase; }
          .badge { background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 13px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          .table th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1; }
          .table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; }
          .total-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; text-align: right; margin-bottom: 24px; }
          .total-amount { font-size: 20px; font-weight: 800; color: #1e293b; }
          .footer { font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">GharKaExpert</div>
            <div style="font-size: 12px; color: #64748b;">Direct Karigar Connect Platform • 0% Commission</div>
          </div>
          <div style="text-align: right;">
            <span class="badge">OFFICIAL RECEIPT</span>
            <div style="font-size: 12px; margin-top: 4px; font-weight: bold; color: #334155;">#${invoiceNo}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <strong>Billed To (Customer):</strong><br />
            ${booking.customerName || 'Customer'}<br />
            Phone: ${booking.customerPhone || 'Verified Number'}<br />
            Site: ${booking.address}
          </div>
          <div>
            <strong>Service Provider (Karigar):</strong><br />
            ${booking.workerName}<br />
            Trade: ${booking.trade.toUpperCase()} (Aadhaar Verified)<br />
            Date of Service: ${bookingDateStr} (${completionDateStr})
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Service Item</th>
              <th>Category</th>
              <th style="text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${booking.trade.toUpperCase()} Doorstep Service</strong><br />
                <span style="font-size: 11px; color: #64748b;">${booking.notes || 'Full doorstep repair & inspection'}</span>
              </td>
              <td>${booking.trade}</td>
              <td style="text-align: right; font-weight: bold;">₹${amount}</td>
            </tr>
            <tr>
              <td>Platform Brokerage Commission</td>
              <td>0% Direct Policy</td>
              <td style="text-align: right; color: #16a34a; font-weight: bold;">₹0 (Free)</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div style="font-size: 12px; color: #64748b;">Total Amount Paid Directly to Karigar</div>
          <div class="total-amount">₹${amount}</div>
          <div style="font-size: 11px; color: #16a34a; font-weight: bold; margin-top: 4px;">✔ Paid & Settled (Direct Cash / UPI)</div>
        </div>

        <div class="footer">
          <p>Thank you for supporting local independent Karigars with <strong>GharKaExpert</strong>.</p>
          <p>30-Day Platform Warranty Protected • Anti-Bypass Guarded • Support: help@gharkaexpert.in</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20 shrink-0">
              <CalendarCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white leading-tight">
                {currentRole === 'worker' ? 'Mestri / Karigar Job History' : 'Bookings & Service History'}
              </h2>
              <p className="text-[11px] text-blue-100">
                {currentRole === 'worker' 
                  ? 'Track completed service logs, verified earnings, and customer reviews'
                  : 'Track past orders, download receipts, and quick re-book verified Karigars'}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full border border-white/30 shrink-0">
            {currentRole === 'worker' ? 'Worker View' : 'Customer View'}
          </span>
        </div>

        {/* Worker Summary Metric Banner (If Worker Role) */}
        {currentRole === 'worker' && (
          <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3.5 border-t border-white/20 text-center">
            <div className="bg-white/10 rounded-xl p-2 border border-white/10">
              <span className="text-[10px] text-blue-200 font-bold block uppercase">Total Earned</span>
              <span className="text-sm sm:text-base font-black text-amber-300 font-mono">
                ₹{workerTotalEarned.toLocaleString()}
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 border border-white/10">
              <span className="text-[10px] text-blue-200 font-bold block uppercase">Completed</span>
              <span className="text-sm sm:text-base font-black text-white font-mono">
                {workerCompletedJobs.length} Jobs
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 border border-white/10">
              <span className="text-[10px] text-blue-200 font-bold block uppercase">Client Rating</span>
              <span className="text-sm sm:text-base font-black text-emerald-300 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>{workerAvgRating}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs: All, Completed, In Progress, Cancelled */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto text-xs font-bold text-slate-600 custom-scrollbar">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-white text-blue-700 shadow-xs font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          All ({bookings.length})
        </button>
        <button
          onClick={() => setActiveFilter('completed')}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
            activeFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed ({completedBookings.length})</span>
        </button>
        <button
          onClick={() => setActiveFilter('in_progress')}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
            activeFilter === 'in_progress'
              ? 'bg-blue-600 text-white shadow-xs font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>In Progress ({inProgressBookings.length})</span>
        </button>
        <button
          onClick={() => setActiveFilter('cancelled')}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
            activeFilter === 'cancelled'
              ? 'bg-rose-600 text-white shadow-xs font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancelled ({cancelledBookings.length})</span>
        </button>
      </div>

      {/* Bookings List Cards */}
      {displayedBookings.length > 0 ? (
        <div className="space-y-3">
          {displayedBookings.map((b) => {
            const workerObj = workersList.find(w => w.id === b.workerId) || workersList[0];
            const amount = b.totalPaidAmount || b.quote?.totalAmount || (b.trade.includes('mason') ? 850 : 750);
            const isCompleted = b.status === 'completed';
            const isCancelled = b.status === 'cancelled';
            const isInProgress = b.status === 'in_transit' || b.status === 'work_started' || b.status === 'accepted';

            return (
              <div
                key={b.id}
                className={`bg-white border rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3 transition-all ${
                  isCompleted 
                    ? 'border-slate-200 hover:border-emerald-300'
                    : isCancelled
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-blue-300 ring-1 ring-blue-400/30'
                }`}
              >
                {/* Header info & Status Tag */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 p-0.5 shrink-0 overflow-hidden shadow-2xs">
                      <img
                        src={getCategory3DIcon(b.trade)}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {b.trade.toUpperCase()} • {getCategoryLabel(b.trade, currentLanguage)}
                        </span>
                        {b.isEmergency && (
                          <span className="text-[9px] font-black uppercase bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                            🚨 Emergency
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-bold flex items-center gap-1 mt-0.5">
                        <span className="text-blue-700">{b.workerName}</span>
                        <span>•</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          {b.bookingDate} ({b.timeSlot})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isCancelled
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                    }`}
                  >
                    {isCompleted ? '✓ Completed' : isCancelled ? '✕ Cancelled' : '⏳ In Progress'}
                  </span>
                </div>

                {/* Address & Pinned Details */}
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">
                      <strong>Site:</strong> {b.address}
                    </span>
                  </div>
                  {b.notes && (
                    <p className="text-[11px] text-slate-500 pl-5">
                      Notes: {b.notes}
                    </p>
                  )}
                  {isCancelled && b.cancellationReason && (
                    <p className="text-[11px] text-rose-700 pl-5 font-semibold">
                      Reason for cancellation: {b.cancellationReason}
                    </p>
                  )}
                </div>

                {/* Amount Paid & Settlement Details */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block font-medium">
                      {currentRole === 'worker' ? 'Earned Amount:' : 'Total Paid Amount:'}
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono flex items-center gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{amount}</span>
                      <span className="text-[10px] text-emerald-700 font-sans font-bold ml-1.5 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        0% Commission
                      </span>
                    </span>
                  </div>

                  {/* Rating / Review Display (if rated) */}
                  {(b.rating || b.review) && (
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>Rated {b.rating || b.review?.stars}/5</span>
                      {b.review?.comment && (
                        <span className="text-[10px] text-slate-500 max-w-[120px] truncate ml-1 font-normal">
                          "{b.review.comment}"
                        </span>
                      )}
                    </div>
                  )}

                  {/* Start Work Code (if in progress) */}
                  {isInProgress && (b.startWorkCode || b.startServiceOtp) && (
                    <div className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-lg text-xs font-mono font-bold">
                      Code: {b.startWorkCode || b.startServiceOtp}
                    </div>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Customer Actions */}
                    {currentRole === 'customer' && isCompleted && (
                      <>
                        <button
                          onClick={() => setSelectedReceiptBooking(b)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Receipt</span>
                        </button>

                        <button
                          onClick={() => handlePrintOrDownloadInvoice(b)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-blue-200 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Invoice</span>
                        </button>
                      </>
                    )}

                    {/* Quick Re-Book Button */}
                    {workerObj && (
                      <button
                        onClick={() => onBookAgain(workerObj)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Book Again ⚡</span>
                      </button>
                    )}

                    {/* Worker Role View: Print Receipt */}
                    {currentRole === 'worker' && isCompleted && (
                      <button
                        onClick={() => handlePrintOrDownloadInvoice(b)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Job Slips</span>
                      </button>
                    )}
                  </div>

                  {/* Secondary Quick Contact */}
                  <div className="flex items-center gap-1.5">
                    {isInProgress && onOpenLiveTracker && (
                      <button
                        onClick={() => onOpenLiveTracker(b)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <span>Live Track</span>
                      </button>
                    )}

                    {workerObj && (
                      <>
                        <button
                          onClick={() => onCallWorker(workerObj)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-200"
                          title="Call Karigar"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => onChatWorker(workerObj)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-200"
                          title="Chat Karigar"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 space-y-2">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700">No service records found in this view</p>
          <p className="text-[11px] text-slate-400">
            Bookings completed or updated will automatically appear here with official invoices and ratings.
          </p>
        </div>
      )}

      {/* POPUP MODAL: RECEIPT & INVOICE DETAILS */}
      <AnimatePresence>
        {selectedReceiptBooking && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-slate-800 space-y-4 shadow-2xl my-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      GharKaExpert Payment Receipt
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Invoice #{selectedReceiptBooking.invoiceNumber || `GKE-${selectedReceiptBooking.id.slice(-6).toUpperCase()}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceiptBooking(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Receipt Content */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Customer:</span>
                    <span className="font-bold text-slate-900">{selectedReceiptBooking.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Karigar:</span>
                    <span className="font-bold text-slate-900">{selectedReceiptBooking.workerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Trade Service:</span>
                    <span className="font-bold text-slate-900 uppercase">{selectedReceiptBooking.trade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Date & Slot:</span>
                    <span className="font-mono text-slate-800">{selectedReceiptBooking.bookingDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Site Address:</span>
                    <span className="font-medium text-slate-800 text-right max-w-[200px] truncate">{selectedReceiptBooking.address}</span>
                  </div>
                </div>

                {/* Amount Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-2.5 bg-slate-100 font-bold text-slate-700 flex justify-between">
                    <span>Description</span>
                    <span>Amount</span>
                  </div>
                  <div className="p-2.5 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-700">{selectedReceiptBooking.trade.toUpperCase()} Doorstep Service</span>
                      <span className="font-mono font-bold">₹{selectedReceiptBooking.totalPaidAmount || 750}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Platform Commission</span>
                      <span className="font-bold">₹0.00 (0% Free)</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-black text-slate-900">Total Settled</span>
                    <span className="font-black font-mono text-base text-blue-700">
                      ₹{selectedReceiptBooking.totalPaidAmount || 750}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  <BadgeCheck className="w-4 h-4 shrink-0" />
                  <span>Verified Direct Settlement • 30-Day Platform Warranty Active</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handlePrintOrDownloadInvoice(selectedReceiptBooking)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Download PDF Invoice</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
