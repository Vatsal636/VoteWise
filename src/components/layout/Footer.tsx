export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0 mt-auto bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row max-w-screen-2xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col space-y-1 text-center md:text-left">
          <p className="text-sm font-semibold">
            VoteWise AI
          </p>
          <p className="text-xs text-muted-foreground max-w-lg">
            Disclaimer: This application is for educational and guidance purposes only. 
            Always verify final legal, deadline, and election details from your official local election authority sources.
          </p>
        </div>
      </div>
    </footer>
  );
}
