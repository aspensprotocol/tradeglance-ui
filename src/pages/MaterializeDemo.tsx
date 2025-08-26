import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MaterializeDemo = (): JSX.Element => {
  return (
    <Layout>
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Materialize CSS Integration Demo
          </h1>
          <p className="text-xl text-gray-600">
            Explore the enhanced Materialize CSS components integrated with
            shadcn/ui
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Materialize Card */}
          <Card className="materialize-card">
            <CardHeader>
              <CardTitle>Materialize Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                This card uses Materialize CSS styling with enhanced shadcn/ui
                components.
              </p>
              <Button variant="materialize" className="w-full">
                Materialize Button
              </Button>
            </CardContent>
            <footer className="card-action">
              <Button variant="materializeFlat" size="sm">
                Action 1
              </Button>
              <Button variant="materializeFlat" size="sm">
                Action 2
              </Button>
            </footer>
          </Card>

          {/* Materialize Input */}
          <Card>
            <CardHeader>
              <CardTitle>Materialize Input</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Materialize styled input"
                variant="materialize"
                className="mb-4"
              />
              <Input
                placeholder="Large input"
                variant="materialize"
                inputSize="lg"
                className="mb-4"
              />
              <Input
                placeholder="Small input"
                variant="materialize"
                inputSize="sm"
              />
            </CardContent>
          </Card>

          {/* Materialize Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Materialize Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <article className="bg-blue-100 p-4 rounded text-center">
                  <h3 className="font-semibold text-blue-800">Blue</h3>
                  <p className="text-blue-600">Primary color</p>
                </article>
                <article className="bg-teal-100 p-4 rounded text-center">
                  <h3 className="font-semibold text-teal-800">Teal</h3>
                  <p className="text-teal-600">Secondary color</p>
                </article>
                <article className="bg-green-100 p-4 rounded text-center">
                  <h3 className="font-semibold text-green-800">Green</h3>
                  <p className="text-green-600">Success color</p>
                </article>
              </section>
            </CardContent>
          </Card>

          {/* Materialize Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Materialize Grid</CardTitle>
            </CardHeader>
            <CardContent>
              <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <article className="bg-blue-500 text-white p-3 rounded text-center">
                  Blue
                </article>
                <article className="bg-teal-500 text-white p-3 rounded text-center">
                  Teal
                </article>
                <article className="bg-green-500 text-white p-3 rounded text-center">
                  Green
                </article>
                <article className="bg-orange-500 text-white p-3 rounded text-center">
                  Orange
                </article>
                <article className="bg-red-500 text-white p-3 rounded text-center">
                  Red
                </article>
                <article className="bg-cyan-500 text-white p-3 rounded text-center">
                  Cyan
                </article>
                <article className="bg-gray-300 text-gray-800 p-3 rounded text-center">
                  Light
                </article>
                <article className="bg-gray-700 text-white p-3 rounded text-center">
                  Dark
                </article>
              </section>
            </CardContent>
          </Card>

          {/* Materialize Spacing */}
          <Card>
            <CardHeader>
              <CardTitle>Materialize Spacing</CardTitle>
            </CardHeader>
            <CardContent>
              <article className="space-y-2">
                <p className="p-1 bg-gray-100 rounded">Padding 1</p>
                <p className="p-2 bg-gray-100 rounded">Padding 2</p>
                <p className="p-3 bg-gray-100 rounded">Padding 3</p>
                <p className="p-4 bg-gray-100 rounded">Padding 4</p>
              </article>
            </CardContent>
          </Card>

          {/* Materialize Text */}
          <Card>
            <CardHeader>
              <CardTitle>Materialize Text</CardTitle>
            </CardHeader>
            <CardContent>
              <article className="mt-8">
                <h1 className="text-4xl font-bold mb-4">Heading 1</h1>
                <h2 className="text-3xl font-semibold mb-3">Heading 2</h2>
                <h3 className="text-2xl font-medium mb-2">Heading 3</h3>
                <p className="text-base text-gray-600">
                  Regular paragraph text
                </p>
              </article>
            </CardContent>
          </Card>
        </section>

        <footer className="mt-8">
          <article className="space-y-2">
            <p className="text-center text-gray-600">
              This demo showcases the integration between Materialize CSS and
              shadcn/ui components.
            </p>
            <p className="text-center text-sm text-gray-500">
              All components maintain their accessibility and functionality
              while gaining Materialize styling.
            </p>
          </article>
        </footer>
      </main>
    </Layout>
  );
};

export default MaterializeDemo;
