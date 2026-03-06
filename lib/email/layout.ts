import { BrandTheme } from "@/lib/theme";

export function emailLayout(
  business: any,
  theme: BrandTheme,
  content: string
) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" 
    style="background:${theme.backgroundSoft}; padding:30px; font-family:'Inria Serif', serif;">
    
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0"
          style="background:#ffffff; border-radius:14px; overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="
              background: linear-gradient(135deg, ${theme.primary}, ${theme.accent});
              padding:30px;
              text-align:center;
              color:#ffffff;
            ">
              ${
                business.logo
                  ? `<img src="${business.logo}" 
                       style="max-height:60px; margin-bottom:10px;" />`
                  : ""
              }
              <h2 style="margin:0; font-size:22px;">
                ${business.name}
              </h2>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:30px; color:#333;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="
              padding:20px;
              background:#f6f6f6;
              font-size:12px;
              text-align:center;
              color:#777;
            ">
              © ${new Date().getFullYear()} ${business.name} <br/>
              Powered by Lodday
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
  `;
}
