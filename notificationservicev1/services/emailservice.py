import smtplib
import ssl
from email.message import EmailMessage

EMAIL_SENDER = 'moduleyprojectds@gmail.com'
EMAIL_PASSWORD = 'rfsm ttqg aglz bcvf'


def send_email(email_receiver: str, message: str, subject: str = "Notification"):
    em = EmailMessage()
    em['From'] = EMAIL_SENDER
    em['To'] = email_receiver
    em['Subject'] = subject
    em.set_content(message)

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
        smtp.login(EMAIL_SENDER, EMAIL_PASSWORD)
        smtp.sendmail(EMAIL_SENDER, email_receiver, em.as_string())
