import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SubTracker Pro - Admin Multi-Member & Pool Guard",
  description: "Monitor member slots, manage manual kicks for Google One, Canva Team, Workspace, and broadcast billing reminders via WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  // 1. Physically strip extension attributes before React hydrates
                  function cleanNode(node) {
                    if (node && node.nodeType === 1) {
                      if (node.hasAttribute('bis_skin_checked')) {
                        node.removeAttribute('bis_skin_checked');
                      }
                      var children = node.querySelectorAll ? node.querySelectorAll('[bis_skin_checked]') : [];
                      for (var i = 0; i < children.length; i++) {
                        children[i].removeAttribute('bis_skin_checked');
                      }
                    }
                  }

                  cleanNode(document.documentElement);

                  // 2. Intercept any runtime injection by browser extensions
                  if (window.MutationObserver) {
                    var observer = new MutationObserver(function(mutations) {
                      for (var i = 0; i < mutations.length; i++) {
                        var m = mutations[i];
                        if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                          m.target.removeAttribute('bis_skin_checked');
                        } else if (m.type === 'childList') {
                          for (var j = 0; j < m.addedNodes.length; j++) {
                            cleanNode(m.addedNodes[j]);
                          }
                        }
                      }
                    });
                    observer.observe(document.documentElement, {
                      attributes: true,
                      attributeFilter: ['bis_skin_checked'],
                      childList: true,
                      subtree: true
                    });
                  }

                  // 3. Suppress runtime errors and console noise injected by third-party browser extensions
                  window.addEventListener('error', function(event) {
                    var filename = event.filename || (event.error && event.error.stack) || '';
                    var message = event.message || (event.error && event.error.message) || '';
                    if (
                      filename.indexOf('chrome-extension://') !== -1 ||
                      filename.indexOf('moz-extension://') !== -1 ||
                      message.indexOf('M_ID') !== -1 ||
                      message.indexOf('bis_skin_checked') !== -1
                    ) {
                      event.preventDefault();
                      event.stopPropagation();
                      event.stopImmediatePropagation();
                      return true;
                    }
                  }, true);

                  window.addEventListener('unhandledrejection', function(event) {
                    var reason = event.reason;
                    var reasonStr = (reason && (reason.stack || reason.message)) ? (reason.stack || reason.message) : '';
                    if (
                      reasonStr.indexOf('chrome-extension://') !== -1 ||
                      reasonStr.indexOf('moz-extension://') !== -1 ||
                      reasonStr.indexOf('M_ID') !== -1 ||
                      reasonStr.indexOf('bis_skin_checked') !== -1
                    ) {
                      event.preventDefault();
                      event.stopPropagation();
                      event.stopImmediatePropagation();
                    }
                  }, true);

                  var origOnError = window.onerror;
                  window.onerror = function(msg, url, lineNo, columnNo, error) {
                    var urlStr = (url || '') + (error && error.stack ? error.stack : '');
                    var msgStr = typeof msg === 'string' ? msg : (error && error.message ? error.message : '');
                    if (
                      urlStr.indexOf('chrome-extension://') !== -1 ||
                      urlStr.indexOf('moz-extension://') !== -1 ||
                      msgStr.indexOf('M_ID') !== -1 ||
                      msgStr.indexOf('bis_skin_checked') !== -1
                    ) {
                      return true;
                    }
                    if (origOnError) {
                      return origOnError.apply(this, arguments);
                    }
                  };

                  var origError = console.error;
                  console.error = function() {
                    for (var k = 0; k < arguments.length; k++) {
                      var arg = arguments[k];
                      if (typeof arg === 'string' && (arg.indexOf('bis_skin_checked') !== -1 || arg.indexOf('M_ID') !== -1 || arg.indexOf('chrome-extension://') !== -1)) {
                        return;
                      }
                      if (arg && typeof arg === 'object' && arg.message && typeof arg.message === 'string' && (arg.message.indexOf('bis_skin_checked') !== -1 || arg.message.indexOf('M_ID') !== -1 || arg.message.indexOf('chrome-extension://') !== -1)) {
                        return;
                      }
                    }
                    origError.apply(console, arguments);
                  };
                }
              })();
            `,
          }}
        />
      </head>
      <body 
        suppressHydrationWarning 
        className="min-h-full flex flex-col font-sans bg-slate-50 dark:bg-[#060911] text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
