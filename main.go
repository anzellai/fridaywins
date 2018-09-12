package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

var (
	// VERSION from build flag
	VERSION string
	// COMMIT from build flag
	COMMIT string
	// BRANCH from build flag
	BRANCH string
)

func main() {
	fmt.Println("--------------------------------------------------")
	programMeta := fmt.Sprintf(
		" Welcome to FridayWins v%s\n\n Commit: %s\n Branch: %s\n",
		VERSION, COMMIT, BRANCH,
	)
	fmt.Println(programMeta)
	fmt.Println("--------------------------------------------------")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	r.StaticFile("favicon.ico", "./public/static/favicon-160x160.png")
	r.Static("/static", "./public/static")
	r.LoadHTMLGlob("./public/templates/*")

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "home.html", gin.H{})
	})

	r.NoRoute(func(c *gin.Context) {
		c.HTML(http.StatusNotFound, "404.html", gin.H{})
	})

	r.Run(fmt.Sprintf(":%s", port))
}
