// Presentation-only crops and palette adjustments. Original exports stay unchanged.
// Load with PowerShell Add-Type -Path scripts/media/HopperPlots.cs -ReferencedAssemblies System.Drawing.
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

public static class HopperPlots
{
    public static void Export(string workspace)
    {
        string folder = Path.Combine(workspace, "assets/img/lunar-hopper");
        // Preserve complete axes, units, legends, requirement circles and annotations.
        Panel(folder, "gn-touchdown-dispersion.png", "touchdown-outbound-scatter.png", 0, 100, 770, 680);
        Panel(folder, "gn-touchdown-dispersion.png", "touchdown-outbound-distribution.png", 770, 100, 730, 680);
        Panel(folder, "gn-touchdown-dispersion.png", "touchdown-return-scatter.png", 0, 780, 770, 690);
        Panel(folder, "gn-touchdown-dispersion.png", "touchdown-return-distribution.png", 770, 780, 730, 690);
        Panel(folder, "astro-flight-profiles.png", "flight-profiles-detail.png", 0, 44, 1419, 1238);
    }

    private static void Panel(string folder, string source, string output, int x, int y, int w, int h)
    {
        using (Bitmap original = new Bitmap(Path.Combine(folder, source)))
        using (Bitmap panel = original.Clone(new Rectangle(x, y, w, h), PixelFormat.Format32bppArgb))
        {
            for (int row = 0; row < h; row++)
                for (int col = 0; col < w; col++)
                {
                    Color c = panel.GetPixel(col, row);
                    int high = Math.Max(c.R, Math.Max(c.G, c.B));
                    int low = Math.Min(c.R, Math.Min(c.G, c.B));
                    // Match navy labels and quiet grid lines; retain colored data series.
                    if (high - low <= 5)
                    {
                        double gray = (c.R + c.G + c.B) / 3.0;
                        Color replacement;
                        if (gray >= 247) replacement = Color.FromArgb(c.A, 255, 255, 255);
                        else
                        {
                            double t = gray / 255.0;
                            replacement = Color.FromArgb(c.A,
                                (int)Math.Round(14 + 241 * t),
                                (int)Math.Round(26 + 229 * t),
                                (int)Math.Round(51 + 204 * t));
                        }
                        panel.SetPixel(col, row, replacement);
                    }
                }
            panel.Save(Path.Combine(folder, output), ImageFormat.Png);
            Console.WriteLine(output + ": " + w + " x " + h);
        }
    }
}
