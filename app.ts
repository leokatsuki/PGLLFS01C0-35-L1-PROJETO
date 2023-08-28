import AdminJS, { useHistoryListen } from "adminjs";
import AdminJSExpress from "@adminjs/express";
import express from "express";
import session from 'express-session';
import * as AdminJSSequelize from '@adminjs/sequelize'
import { Task, User } from "./models";
import { generateResource } from "./utils/modeling-model";
import { encryptPassword } from "./utils/user-utils";
import { sequelize } from "./db";
import bcrypt from 'bcryptjs';
import hbs from 'hbs';
import Mail from "./utils/Mail";
import dashboard from "./routes/dashboard";

const path = require('node:path');
const mysqlStore = require('express-mysql-session')(session);
require('dotenv').config();

AdminJS.registerAdapter({
    Resource: AdminJSSequelize.Resource,
    Database: AdminJSSequelize.Database,
});

const bodyParser = require('body-parser');
const PORT = 3000;
const ROOT_DIR = __dirname;

const email = new Mail(ROOT_DIR);

const start = async () => {
    const app = express();
    sequelize.sync().then((result) => {
        console.log(result);
    }).catch((error) => {
        console.log(error);
    })

    const admin = new AdminJS({
        resources: [
            generateResource(User, {
                password: {
                    type: "password",
                    isVisible: {
                        add: true, list: false, edit: true, filter: false, show: false
                    }
                }
            }, {
                new: {
                    before: async(request: any) => {
                        await email.sendEmail(request.payload.email, "Bem vindo a CIAL", "password-send", {
                            text: 'Sua senha de acesso: ',
                            name: request.payload.name, 
                            password: request.payload.password
                        })
                        return encryptPassword(request)
                    }
                },
                edit: {
                    before: async(request: any, context: any) => {
                        if(request.method !== 'post') return request

                        if(request.payload.password !== context.record.params.password){
                            await email.sendEmail(request.payload.email, "Alteracao de senha", "password-send", {
                                text: 'sua senha sofreu alteracao. Sua nova senha e: ',
                                name: request.payload.name, 
                                password: request.payload.password
                            })
                            return encryptPassword(request)
                        }
                        return request
                    }
                }
            }),
            generateResource(Task),
        ],
        rootPath: '/admin',
        dashboard: {
            component: AdminJS.bundle('./components/dashboard.jsx')
        },
        branding: {
            favicon: "data:image/jpeg;base64,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",
            logo: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHCA8PEQ8PDw8SDw8PEg8SDxAQDxIRDw8RGBQZGhgUGBgcIS4mHB44HxgYJzgmKzAzNTU1GiQ7QEg0Pzw0NTEBDAwMEA8QHhISHDQrJSc2OD89PzQ9Pz80NDQ9NTQ6MTQ0OjY/PTExNj82Ojo9ND81ODQ0NDQ6MTQ0NjY0NDE0Pf/AABEIAOEA4QMBIgACEQEDEQH/xAAcAAADAAMBAQEAAAAAAAAAAAAAAQIFBgcDBAj/xABIEAACAgIAAwUEBgYGBgsAAAABAgADBBEFEiEGEzFBUQciYXEUMnOBkbIzNFKCs9EjNUJ0g5IXU3KTscEVJEVihKGiw9Lh4v/EABcBAQEBAQAAAAAAAAAAAAAAAAACAQP/xAAmEQEBAAIBAwMEAwEAAAAAAAAAAQIRMQMhQRIygWFxobFRkfAi/9oADAMBAAIRAxEAPwDewJQEAJQEAAjAgBKAgAEYEYEAIBqGowI9QFqPUrUNQFqGpWo9QJ1DUrUNQJ1DUrUNQI1DUvUWoEai1PTUWoHnqGpepJECSIiJRECIHmRERLIiIgeZEkiehEkiBGoStQgWBGBACUIABKAgBGBAQEoCAEoCAgJWoASgIC1HqPUeoC1DUrUNQFqGo9Q1AWoaj1DUCdQ1K1DUCNRal6i1AgiIiWRERA8yIiJZERECCJJEsiIiBBEkiWRJIgTCPUIFiMQEYgAEoCAlAQACUBACUBAQEoCAEYEBAR6jAj1AWo9R6j1AnUepWoagTqLUvUNQI1FqXqGoHnqGpepJECSIiJRERECCJJE9CJJECCJJEsiSYEkSTKMRgTCPUIDEoRCUIDEoQEoQACUBARgQACUBACMCAARgRgSgIC1HqPUNQFqGpWoagLUWpWoagTqLUrUNQIIkkT0IkkQIIkkT0IkkQIIiIlERGBBkmWZJgQZBnoZJgRCOEChLEkShAoShEJhOP9qcTh+1sc2Xa2KK9F/gW8kHz+7cDPCMTkmd7ROIWE9ytWMnlpO8cfNn6H/KJjT2y4qev01/urpA/AJA7eBKAnHuH+0PiNRHemvJTzDoK3I+DJoD7wZ0fsx2kp4mjvWj1vUUFtb6PKW3ykMOjD3T6Hp4CBnAIwJzXt72nzsfJbHx7RSlZUhkQc781asQxbY1snwAmtYva/irPWpzbCGsQEctfUFgCPqzJdplmU3P9p3ACPUoiAE1RahqVqYftRxteH4xvKh2LKqITrnO9t18vdDffqZbplsk3WW1DU1jsD2ibiOPZ3pH0mmxhYB0BrclkYD01tf3DNp1NajUREvURECCIiJybtZ2v4gmVbVVf3CVPbWq1ovvhXYBm5t+9oDw1Ps9nnH87KzWrycmy2sY9r8jcvLzB0APQD1P4zJdzbMbMpuOlmSZ6GSZrXmYjG7BQWY6VQST6ADqZyHintAz7XZsdxi07PIgrrdynkXZwfe+WgPj4wOtmSZo+Hw/tVdWloya6w6hgly0pYoPhzKKjyn4ePro9J9nZzhvaC691z8h8aisfWWvDZr330VdIfd6bJPwA8yA2oyTPLHtfmupcg2UOFZ1HKtisoZWA2deJBG/FW8tT1MBQjhAYlCSJGTkLVW9r/UrRnb5KN6hluu7WO3Hac4SdxjkfSrBst49yh8/9r09PH0nJ3csWZmLMxLMzHbMT4kk+Jn1cVzHyb7bnO2dmJ9B18B8P+Wptns57Opk2NmXoHqocLUjDavaACWI8woI+8/CZP5Zh3m75Y3hPYniGUi2BFpRuqNcxRnHqFAJ189TIP7N84DYspc+iuwJ/ECdXEoRZ9Sy3zpwPinBMnEbkurZD4jY+sPVSOjD5Ezd/ZB/2h/4X/3Zv+bhVZKNVcgdG8j4g+oPiD8RPm4JwPHwQwoXTOFFjHobOQtylgOnNpiCQOuhMm/LMfVLq95+XLvaV+v2/wCD/BSaxhfpaftK/wAwmz+0r9ft/wAH+Ck1jA/TU/a1fnEY8fNT0fbfvX6QI6mMCMjqYwJTqNTjXtO4z9Iy+4Rt14206eBffvn8QB+5OodpuKjBxLr9gOF5agfOxui/PXVj8AZ+fbbC7M7EksSSSdn7zJve6Rf+rJ/Hdnuw3GvoGbU7tqm3+hv2fdCORpz8m5Tv05p3kifmUidz9nvGvp2CnO278bVN2z7zco9xz67XXX1DSltmIkkSyIiIHAO1369lfb5H8VpmPZX/AFi391u/PXMP2v8A17K+3yP4rTMeyv8ArFv7rf8Anrk48OXQ9n9/t2AyTKMRlOr5OIfobvs7PyGcR7HXU1Z+Jbkcnc1myx+fXKCtLsrHfowUjz2BrZ0J3DOUmq4AbJrsAHqeUz87L4D5CB0i/wBqd3eN3eMDVze6WsCuU348vKdH4bM6JicVTKwfplBIFlNjpse8jAEEH4hgR90/OqgkgAEkkAADZJPgAPMzstGavBuC115LI14SxBXW4YmyxncL09A3U+HQ+XWBhvZje9tebbY5d3uRndjtmYp4zdjNG9lK6x8r071Bv4hB/MfjN6MCYQhAoTB9tLCuDdo652qX7ucE/wDCZwTBdtULYNpH9lqmPy5wP+czLiufW9l+zjE7T2Bp5OG4o83Flh+PNY5H/lr8JxcjWx6dJ2rsJeLOG4pH9hXrI9Cjsv8AwAP3zVzhsIliSJQhqhKEkShA437Sv1+3/B/gpNXwP01H2tX5xNo9pf6/d/g/wUmsYH6aj7Wr84k48fNculxfvX6SPiYxDznw8a4imHj3ZDaPdoSAfBmPRV+8kSrdOlsk3XM/arxrvbkw0b3KBt9eBsYdfwGh97TSeE8PfLyKMZPr3uqA+PKviz/IKGb7p5ZmS91j2uxZ3ZmZj4kk7J/E7++bT7OuJcPwb7cnNuKOqCvHUU22fWPvt7ikDoFA/wBppMjMJZN3msFx7hjYl9lLDRrYqfQ6+qw+BXR++Zf2d8a+hZyK7apyuWm3fgGJ/o2+5jr4B2mS7f8AF+F5xruxby931LFNFybUdUbbKBsHY9SGHpNEImzfFT0/VJZl4/MfpsiIzAdiON/T8Gq123dX/RZHqbFA94/NSrfvGbAZro/P/bH9eyvt8j+I0zHsq/rFv7rf+euYjtl+vZX2+R/EaZf2Vf1i391v/PXJx4cuj7J8/t2AxGMxGU6oM0jins6xbrHsqtsxg5LNWqq6BidnlB0VHw3r01N2dgoLMdKoJJPgAPEzknE/aLmvYxxe7oo2eQNWLLGXyZy3TfnoDp4dfGBmV9mlakMudYrKQVIqUFSD0IPN0M9sjsAbeXv+J5VwUnlFm35d+PLzsdeA/CYjB432jyVD01O6EArY2NVXUwPgQ7gKR8dyeL9oePYDJ9JKKHG0YV1PW5HivOvTmHmN7+7rA6BwrhlOHUuPQpVF2SWO3dj4ux8z/IDwn1mYbsnx4cQx+9ZAlqOa7UXfJzaBDLvyII+XUdfGZkwFCEIDE8eIYovptpPTvEdAfQkdD+OjPYShFZZLNVwLPpZHdWHKdnYPiGB0w+e5tfs+7TJiO2LkNy49zcyWE+7VYQAeb0UgDr5EfEkZXt92bL82XSuwet6gdUb/AFmv2T5+nj665u6FSQRoiTjfF8OXSy1PRlzPzPD9GCUJw3g3a3iGEoSq0PUvRarl50Qei9Qyj4A6mab2l5+ulGKG9eS0j8OeU7Oq5OTXSj22uqVoCzux0qiY3s32hq4iL3pRlrpsWtWfQZ9qGLa8h119041xvtDmZ5H0m3mRTtKkUJUp9eUeJ+J2Zv8A7Iv1bL+3X+GsDWvaX+v3f4P8FJrHD/0+P9tT+dZs/tK/X7f8H+Ck1nh36fH+2p/OsnHj5rl0eL96/SXnOX+1njW2rwkPRNPdr9oj3VPyU7/eE6NxDMXGqtvf6tSszep14KPiToffPzzxTOfJvtvc7ax2Yny6nfT4enw1Nve6Ve9mPzXyiHI37J/ymdC9k3AxbbdnWqGSkGqkMAQbWG3br6KQP3zOqfRKf9Un+Rf5Rdqu/D81ch/ZP4GIqR4gjfhsan6VOFR/qa/92v8AKcr9qHBRVauRWoVLR1AGlWxRojQ8Nro/MGZbZy55Z5Y6t42x3sy419FzRQ7apzeWs7PRbhvu2+8kr++PSdqM/MoJGiCVI0QQdFSPAg+Rnf8AsnxkcQw6cgkd5rkvA/s3J0fp5A9GHwYSnVxztn+v5X29/wCczLeyr+sW/ut/565iu2n69lfb3/nM+HgnGL8C0345QWFGr99OdeVipPT190SceHPo+yfL9BmIzjZ9onFf26f9wv8AOZvsb2v4hm5tePe9ZqZLWYLUqn3UJHX56lOjf+I/ob/srfyGfnQnS79F/wCU/RfEBum4DqTXZr/KZ+eKSAULDmUFSy71zL5jfygdj7V9of8AoTHwqMehLL3r5Ua3mKVV1KqnwOz1YAKCB4/IrgHGKeO4mWuZj1q9AXvwvManQqxVxs7VgUbWjtdbB6kT2ORwjtHWiu3LfSGYVu3d5FQIHMRo+8vQdQSPDc+HNzuD8Jwc3FxMhGyL67lAR2udrTWVXnZdhNb8yB4wMd7KDvHyj62p+Sb0Zo3sqH9BlenfIP8A0D/6m8mAoQhABLEgShAuarxnsNi5JL1H6O568oXmq38F6FfuOvhNiTMpNhoF1ZvUcxpFiG0L+0U3sD46kVcWxHJCZVDlVZmC31sVVRtmIB6ADxPlMsl5TlhLzHN8n2c5qk8j1OPL3yOn3gTzT2dcQPiaV+LP/IGdTszaEAZ7q0Up3gZ7EVSm1HOCT9XbKN+HvD1nkvGcMqzDLxyilQzfSa+VS2+UE83QnlbXyMzX1ZMbPNaTw/2YDYOVlbHmlCaJ/ff/AOM3vg/CMbCr7rFrFaEgsdku7aA5mY9Sek9UzKWQ3C2s0gFjaLENYA8SX3rU9Rcm0HOu32UHMNuANkr+1069JSpNNA7Ydj83OyrLqQnI3d8pZwCdVqp6fMGY3hXs4zhdW9tldaI6WcwPOWKuDy6BGt6PWdUe1E5ed1TmZUXmYLzO3RVG/EnyE8hxHG5Q/wBIq5C/dh+9r5DZ+wG3rm+HjJk0mYa4tYntnwrLz6Fx8Z60Vm5rWdmUnX1VACnY2SfmBNHq9l2YWUPkUKhI52U2MyrvqQpUbOvLYnUKuI4z2Glcip7lLBqltRrFK/WBUHYI0dz0+lVBO+72vugOY2c692F9efetfGPT33tvp77lfPwDhVeBi04tZ5lrU8zEcpdySWYjy2Senl0EyW5j04zhsrMuXjsiFQ7LkVlULb5QSG6E6OvXRntbn0IXD31K1ah7Fe1VNaE6DMCfdHUdT6ylPq3MR2m4SM7FspGg/wBepm8FsXw36AgkH4MZ9NPFcWwbryaHHOle0vrcd42+VOh+sdHQ8TqGRxPGr2LMimshuQiy6tCG5Q3Kdnx5WU69GBmWbmk2Syy+XLW9l+ds6uxwPIc9nT4fUm4dh+zF/DFtFuQri7lLVKh5FdegZXJHUqdEa8h6TPvxfEVFtbKx1qsYoljZFYrdwdFVYnRO+mhPTK4hj08guvqqNh5a+8tRO8b0TmI5j8ok15JjZ5rm/aDsLnZWTfchqCPZY68znm0zEjY10mN/0a8Q/bo/zn+U69daiKzuyoiAs7uwVEUeJJPQCeWRlVVobbLa66gATY7qlYU+B5idamTHXlkw1NS1yb/RrxD9uj/O38psPY7sVdg5Ayb7qyyq6LWilgQwHvc5I159NTcrOJYqIlr5NK1WfUsa6sVv/ssTpvuk/TkaylEKut62urrZWV5U5d8o3t+rD6vQaO9dN7r6qks8vpM0Lins2x7bHfHyGxkcljUahYiE+Se8pC/Drr5TdMbNou5xVdXaazy2CuxHKN+y3KfdPwM86eI41iu9eRS6VbFjpdW6V68ecg6X75rWgt7LwfHPB+eL/wDuNfZkARvOOvMDG0dfD350N3VVLswVACxYkBQoGyxPkNec+e/NpSvvnurSkhSLXsRayG8Dzk60YHzcG4TTg0rj0A8gJZmY7d3Pi7H16D7gBPtMSOrqrowdGAKspDKwPgQR4iBgKEIQAS1nmJYgahwK3DV8fHtpL8STMyXcKh76ty1hOQ7dP6MoQAdkHmUAHyxfBMmv6Han0rFd/oWaBjJi8mUjCtyea3mPN0B30HjOiiWDA0ns9jOmbTh3Jz1U4FzY7OAyvj2W47Kh2NEqyuvyVZ514u8DhoqWpLH4i45rKedCRZlBedQQXA9NzegZYMDniFjj2YQpNmXlcSY52JTyU1qlSo7rXzHS1siV+8T17w+fSfTgcTSj/opcxhQ2BbnYt3eOGKctA7vmZdgkoydR0JM3wGUDAwXG8lLq+H21OHrfiHD2R16qy954iaHXUeVKOQ92tlPEgf7IsfJTF0Pj0dp1oGMGBpnB+D2ZGTZcTQlOPxbOuDCljmO62OOXn3oJ73p4CY9OLYr8BtxUuR8lMO0vSp99QH6/8R+M6JuVzH1gc9zBTmYr4y5eJlm3LwEc4mL9F5Fd2Vecc7c3Xej5aMxffNfRn5tilHy8St37wb5RXlJSNj0/oydfGdX5jDmgc/yK6s3HTHTOxr2bOxQbcHG+imglLORiOZtsGUkHflPnd3v4b2gsyalXJS5w4Kg8lyYmOjshPgCUJBHkROkc0NwNP4k+FicRL5yVV4rYS14rWVA0LZ3thvRQBoMwas68WA85reSq042N3zrj2fQLVroz8bvcbJxmuc14qkEOlwQoCB10y+OunUyZJMDVu0t72YuDipjO9ma+P3mKrqriitRbdWXYgDooQkn+36zDY2UqJw5c5OSnht+VjZK2gWJRYKh9FstK7GuRtc/hthOgkxEwOcY7vkjEXHqxKieIZ3ct3Fz4OR/1Mu1oRyCVLFxsaG12N+fhXU700pjcy5bY/aIPWqis0ZbGstUijooDEcvXwIPnOmkySYGh5NuFkYmSnDMdmvTh3du9FZTkTmXeM46HvSA+l0SNHw31+Tjl2LkLk2cOVO5r4TnpktUnIg5gnc1P0HvjTnXiBv1nRSZJMDUeNcaoysVcXDdcq3Ieih662AY1kF7BttAbSuwbJ11mKa1Vx6qMlmwrOH5rrW9ldeRj46PU70i4c3KUKPyBgfrKPCdCJkGBheyVnPh1kVpWvPeFFautTqLX1Yiv1VW+sB/3vSZcxmSYBCKEBCWJ5iUIHoJQkCUIFiMSQYwYFgygZ5gygYFgygZ5gygYF7huTuPcCtw3FuG4D3DcW4bgG4bi3FuAyYiYiYiYATJJgTETARMRgTETARkmMyTARkmMyTAcJEIDEYkiMQLEoGQDKBgWDKBnmDKBgWDGDJBjBgUDK3PMGVuBe49yNw3AvcNydw3ArcNydw3ArcW5O4bgMmImLcW4ATETAmImAEySYExEwETJMZMkmAjEYyZJgEIoQEJQMgGUDAsGMGQDKBgWDGDIBjBgegMYMgGMGBYMe5G49wL3Dcnce4D3HuTuG4Fbi3FuG4D3DcW4twHuLcW4twGTETETETACYiYiYiYATETAmImAEySYEySYDhJhAQMoGeYMoGB6AxgyAYwYHoDAGSDGDAsGMGQDHuBe49yNw3A9Nw3I3HuBe4bkbhuBe4bkbhuBW4bk7i3ArcW4txbgPcW4txEwAmBMRMRMBkySYEySYATJJgTETANwi3CACMQhAoRiEIFRiEIDEIQgVHCEAEIQgOEIQCEIQFAwhAIoQgEkxQgBihCAjJMIQJMRhCAoQhA//9k=",
            companyName: "CIAL - Admin Page"
        }
    });

    const sessionStore = new mysqlStore({
        connectionLimit: 10,
        password: process.env.DB_PASS,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        createDatabaseTable: true
    })

    const secret = 'IDP1p9Jyza9tcNr9lQ3xX3lz9asaWH7x';
    const cookieName  = 'adminjs'
    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
        admin,
        {
            authenticate: async(email: string, password: string) => {
                const user = await User.findOne({ where: { email } });
                if(user){
                    const verify = await bcrypt.compare(password, user.getDataValue('password'));
                    if(verify){
                        return user;
                    } 
                    return false;
                }
                return false;
            },
            cookieName: cookieName,
            cookiePassword: secret
        },
        null,
        {
            store: sessionStore,
            resave: true,
            saveUninitialized: true,
            secret: secret,
            cookie: {
                httpOnly: process.env.NODE_ENV === "production",
                secure: process.env.NODE_ENV === "production"
            },
            name: cookieName
        }
    );
    hbs.registerPartials(path.join(ROOT_DIR, 'views'));
    app.set('view engine', '.hbs');
    app.use(admin.options.rootPath, adminRouter);
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use('/dashboard', dashboard)

    app.listen(PORT, () => {
    console.log(
        `AdminJS started on http://localhost:${PORT}${admin.options.rootPath}`
    );
    });
};

start();
