import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// GET /api/widget — Returns embeddable JavaScript widget
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const industry = searchParams.get("industry") ?? "";
  const role = searchParams.get("role") ?? "";
  const max = Math.min(parseInt(searchParams.get("max") ?? "5", 10) || 5, 20);
  const theme = searchParams.get("theme") === "light" ? "light" : "dark";

  // Build the API query string the widget will use
  const apiParams = new URLSearchParams();
  if (industry) apiParams.set("industry", industry);
  if (role) apiParams.set("role", role);
  apiParams.set("per_page", String(max));

  const js = `
(function() {
  var THEME = ${JSON.stringify(theme)};
  var API_PARAMS = ${JSON.stringify(apiParams.toString())};
  var MAX = ${max};

  // Styles
  var COLORS = THEME === 'dark' ? {
    bg: '#111111',
    bgCard: '#191919',
    bgCardHover: '#1f1f1f',
    border: '#262626',
    borderHover: '#383838',
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    textTertiary: '#71717a',
    accent: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444',
    purple: '#a855f7'
  } : {
    bg: '#ffffff',
    bgCard: '#f9fafb',
    bgCardHover: '#f3f4f6',
    border: '#e5e7eb',
    borderHover: '#d1d5db',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    accent: '#3b82f6',
    green: '#16a34a',
    yellow: '#ca8a04',
    red: '#dc2626',
    purple: '#9333ea'
  };

  function getTimeAgo(dateStr) {
    if (!dateStr) return '';
    var diff = Date.now() - new Date(dateStr).getTime();
    var hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    if (days < 7) return days + 'd ago';
    return Math.floor(days / 7) + 'w ago';
  }

  function getFreshnessColor(freshness) {
    if (!freshness) return COLORS.textTertiary;
    var tier = freshness.tier || '';
    if (tier === 'very_fresh' || tier === 'fresh') return COLORS.green;
    if (tier === 'recent' || tier === 'aging') return COLORS.yellow;
    return COLORS.red;
  }

  // Find the current script tag to inject content after it
  var scripts = document.getElementsByTagName('script');
  var currentScript = scripts[scripts.length - 1];

  // Create container
  var container = document.createElement('div');
  container.id = 'aj-widget-' + Math.random().toString(36).substr(2, 9);
  container.style.cssText = [
    'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'max-width: 480px',
    'border-radius: 12px',
    'border: 1px solid ' + COLORS.border,
    'background: ' + COLORS.bg,
    'overflow: hidden'
  ].join(';');
  currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

  // Header
  var header = document.createElement('div');
  header.style.cssText = [
    'padding: 12px 16px',
    'border-bottom: 1px solid ' + COLORS.border,
    'display: flex',
    'align-items: center',
    'justify-content: space-between'
  ].join(';');
  header.innerHTML = '<div style="display:flex;align-items:center;gap:8px;">' +
    '<div style="width:20px;height:20px;border-radius:4px;background:' + COLORS.accent + ';display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;">J</div>' +
    '<span style="font-size:12px;font-weight:600;color:' + COLORS.textPrimary + ';">AgentJobs</span>' +
    '</div>' +
    '<a href="https://agentjobs.com/search" target="_blank" rel="noopener" style="font-size:11px;color:' + COLORS.accent + ';text-decoration:none;">View all &rarr;</a>';
  container.appendChild(header);

  // Loading state
  var list = document.createElement('div');
  list.style.padding = '8px';
  list.innerHTML = '<div style="padding:24px;text-align:center;font-size:12px;color:' + COLORS.textTertiary + ';">Loading jobs...</div>';
  container.appendChild(list);

  // Determine base URL from the script src
  var baseUrl = '';
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf('/api/widget') !== -1) {
      baseUrl = scripts[i].src.split('/api/widget')[0];
      break;
    }
  }
  if (!baseUrl) baseUrl = 'https://agentjobs.com';

  // Fetch jobs
  fetch(baseUrl + '/api/v1/jobs?' + API_PARAMS)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var jobs = (data.jobs || []).slice(0, MAX);

      if (jobs.length === 0) {
        list.innerHTML = '<div style="padding:24px;text-align:center;font-size:12px;color:' + COLORS.textTertiary + ';">No jobs found</div>';
        return;
      }

      list.innerHTML = '';

      jobs.forEach(function(job) {
        var card = document.createElement('a');
        card.href = job.link || (baseUrl + '/jobs/' + job.id);
        card.target = '_blank';
        card.rel = 'noopener';
        card.style.cssText = [
          'display: block',
          'padding: 12px',
          'margin: 4px',
          'border-radius: 8px',
          'border: 1px solid ' + (job.isFeatured ? COLORS.accent + '40' : COLORS.border),
          'background: ' + (job.isFeatured ? COLORS.accent + '08' : COLORS.bgCard),
          'text-decoration: none',
          'transition: background 0.15s, border-color 0.15s'
        ].join(';');
        card.onmouseenter = function() {
          this.style.background = job.isFeatured ? COLORS.accent + '12' : COLORS.bgCardHover;
          this.style.borderColor = job.isFeatured ? COLORS.accent + '60' : COLORS.borderHover;
        };
        card.onmouseleave = function() {
          this.style.background = job.isFeatured ? COLORS.accent + '08' : COLORS.bgCard;
          this.style.borderColor = job.isFeatured ? COLORS.accent + '40' : COLORS.border;
        };

        var badges = '';
        if (job.isFeatured) {
          badges += '<span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;background:' + COLORS.accent + '20;color:' + COLORS.accent + ';">Featured</span> ';
        }
        if (job.freshness) {
          badges += '<span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:500;background:' + getFreshnessColor(job.freshness) + '18;color:' + getFreshnessColor(job.freshness) + ';">' + job.freshness.label + '</span> ';
        }
        if (job.isRemote) {
          badges += '<span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:500;background:' + COLORS.purple + '18;color:' + COLORS.purple + ';">Remote</span>';
        }

        var meta = [job.company];
        if (job.location) meta.push(job.location);
        if (job.salary) meta.push(job.salary);

        card.innerHTML =
          (badges ? '<div style="margin-bottom:6px;">' + badges + '</div>' : '') +
          '<div style="font-size:13px;font-weight:600;color:' + COLORS.textPrimary + ';line-height:1.3;">' + job.title + '</div>' +
          '<div style="margin-top:4px;font-size:11px;color:' + COLORS.textSecondary + ';">' + meta.join(' &middot; ') + '</div>' +
          (getTimeAgo(job.postedAt) ? '<div style="margin-top:4px;font-size:10px;color:' + COLORS.textTertiary + ';">' + getTimeAgo(job.postedAt) + '</div>' : '');

        list.appendChild(card);
      });
    })
    .catch(function() {
      list.innerHTML = '<div style="padding:24px;text-align:center;font-size:12px;color:' + COLORS.red + ';">Failed to load jobs</div>';
    });
})();
`;

  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
