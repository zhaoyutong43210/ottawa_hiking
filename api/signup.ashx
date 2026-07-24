<%@ WebHandler Language="C#" Class="SignupHandler" %>

using System;
using System.Configuration;
using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Text;
using System.Web;

public class SignupHandler : IHttpHandler
{
    private const string DefaultToEmail = "zhaoyutong43210@gmail.com";

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json; charset=utf-8";

        if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
        {
            WriteJson(context, false, "method_not_allowed");
            return;
        }

        try
        {
            var payload = new SignupPayload
            {
                activityId = (context.Request.Form["activityId"] ?? string.Empty).Trim(),
                activityTitle = (context.Request.Form["activityTitle"] ?? string.Empty).Trim(),
                name = (context.Request.Form["name"] ?? string.Empty).Trim(),
                wechat = (context.Request.Form["wechat"] ?? string.Empty).Trim(),
                note = (context.Request.Form["note"] ?? string.Empty).Trim(),
                lang = (context.Request.Form["lang"] ?? string.Empty).Trim(),
                submittedAt = (context.Request.Form["submittedAt"] ?? string.Empty).Trim()
            };

            if (string.IsNullOrWhiteSpace(payload.name) || string.IsNullOrWhiteSpace(payload.wechat) || string.IsNullOrWhiteSpace(payload.activityId))
            {
                WriteJson(context, false, "missing_required_fields");
                return;
            }

            var gmailUser = GetSetting("OCHC_GMAIL_USER");
            var gmailAppPassword = GetSetting("OCHC_GMAIL_APP_PASSWORD");
            var toEmail = GetSetting("OCHC_SIGNUP_TO_EMAIL");
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                toEmail = DefaultToEmail;
            }

            if (string.IsNullOrWhiteSpace(gmailUser) || string.IsNullOrWhiteSpace(gmailAppPassword))
            {
                WriteJson(context, false, "mail_not_configured");
                return;
            }

            var safeLang = string.IsNullOrWhiteSpace(payload.lang) ? "zh" : payload.lang;
            var submittedAt = string.IsNullOrWhiteSpace(payload.submittedAt) ? DateTime.UtcNow.ToString("u") : payload.submittedAt;
            var activityTitle = string.IsNullOrWhiteSpace(payload.activityTitle) ? payload.activityId : payload.activityTitle;

            var subject = "[OCHC \u62A5\u540D] " + activityTitle + " - " + payload.name;
            var body = string.Join("\r\n", new[]
            {
                "\u6D3B\u52A8\u62A5\u540D\u4FE1\u606F",
                "",
                "\u6D3B\u52A8ID: " + payload.activityId,
                "\u6D3B\u52A8\u540D\u79F0: " + activityTitle,
                "\u59D3\u540D: " + payload.name,
                "\u5FAE\u4FE1\u8D26\u53F7: " + payload.wechat,
                "\u5907\u6CE8: " + (payload.note ?? string.Empty),
                "\u8BED\u8A00: " + safeLang,
                "\u63D0\u4EA4\u65F6\u95F4: " + submittedAt,
                "",
                "\u6765\u6E90: Ottawa Chinese Hiking Club \u7F51\u7AD9"
            });

            using (var message = new MailMessage())
            {
                message.From = new MailAddress(gmailUser, "OCHC Signup Bot");
                message.To.Add(toEmail);
                message.Subject = subject;
                message.Body = body;
                message.IsBodyHtml = false;
                message.SubjectEncoding = Encoding.UTF8;
                message.BodyEncoding = Encoding.UTF8;
                message.HeadersEncoding = Encoding.UTF8;
                message.BodyTransferEncoding = TransferEncoding.Base64;

                using (var smtp = new SmtpClient("smtp.gmail.com", 587))
                {
                    smtp.EnableSsl = true;
                    smtp.DeliveryMethod = SmtpDeliveryMethod.Network;
                    smtp.UseDefaultCredentials = false;
                    smtp.Credentials = new NetworkCredential(gmailUser, gmailAppPassword);
                    smtp.Send(message);
                }
            }

            WriteJson(context, true, "");
        }
        catch (SmtpException)
        {
            WriteJson(context, false, "smtp_failed");
        }
        catch (Exception)
        {
            WriteJson(context, false, "server_error");
        }
    }

    public bool IsReusable
    {
        get { return false; }
    }

    private static string GetSetting(string key)
    {
        var fromConfig = ConfigurationManager.AppSettings[key];
        if (!string.IsNullOrWhiteSpace(fromConfig))
        {
            return fromConfig;
        }

        return Environment.GetEnvironmentVariable(key);
    }

    private static void WriteJson(HttpContext context, bool ok, string code)
    {
        context.Response.StatusCode = 200;
        var safeCode = JsonEscape(code ?? string.Empty);
        context.Response.Write("{\"ok\":" + (ok ? "true" : "false") + ",\"code\":\"" + safeCode + "\"}");
    }

    private static string JsonEscape(string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return string.Empty;
        }

        return input
            .Replace("\\", "\\\\")
            .Replace("\"", "\\\"")
            .Replace("\r", "\\r")
            .Replace("\n", "\\n")
            .Replace("\t", "\\t");
    }

    private class SignupPayload
    {
        public string activityId { get; set; }
        public string activityTitle { get; set; }
        public string name { get; set; }
        public string wechat { get; set; }
        public string note { get; set; }
        public string lang { get; set; }
        public string submittedAt { get; set; }
    }
}
